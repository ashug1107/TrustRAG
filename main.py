import io
import wave
import requests
import speech_recognition as sr
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from deep_translator import GoogleTranslator

from ingestion import process_document, build_indices
from retriever import get_hybrid_candidates

app = FastAPI(title="Backend API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE_URL = "http://127.0.0.1:11434"

global_state = {
    "faiss_index": None,
    "bm25_index": None,
    "chunks": [],
    "metadata": [],
    "processed_filenames": set(),
    "indexed_documents": [],
    "chat_history": []
}

def query_ollama(prompt: str, temperature: float = 0.1) -> str:
    payload = {
        "model": "llama3.2:1b",
        "prompt": prompt,
        "stream": False,
        "keep_alive": 0,  
        "options": {"num_ctx": 2048, "temperature": temperature}
    }
    try:
        res = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload, timeout=120)
        return res.json().get("response", "").strip() if res.status_code == 200 else ""
    except Exception as e:
        print(f"❌ [OLLAMA ERROR]: {e}")
        return ""

def reformulate_query_with_memory(new_query: str, history: list) -> str:
    """Uses the 1B model to rewrite follow-up questions into standalone queries."""
    if not history:
        return new_query
        
    # Grab the most recent interaction from global state
    last_turn = history[0] 
    
    prompt = f"""You are a query rewriting assistant.
    Given the following conversation history, rewrite the New Question to be a standalone, self-contained search query. 
    Do NOT answer the question. Just output the rewritten query.
    
    Previous Question: {last_turn['question']}
    Previous Answer: {last_turn['answerSummary'][:300]}...
    
    New Question: {new_query}
    
    Standalone Query:"""
    
    print("🧠 [MEMORY] Reformulating query based on past context...")
    rewritten_query = query_ollama(prompt, temperature=0.0).replace('"', '').strip()
    
    # Fallback to original query if the LLM output is empty or too long (hallucination)
    if not rewritten_query or len(rewritten_query) > 200:
        return new_query
        
    print(f"🔄 [REWRITE] '{new_query}' -> '{rewritten_query}'")
    return rewritten_query

def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Bulletproof translation with 3 fallbacks so Marathi translation never fails."""
    if not text or not text.strip() or source_lang == target_lang:
        return text
    
    clean_text = text.strip()[:4500]

    # Attempt 1: deep-translator
    try:
        from deep_translator import GoogleTranslator
        res = GoogleTranslator(source=source_lang, target=target_lang).translate(clean_text)
        if res:
            return res
    except Exception as e:
        print(f"⚠️ [deep_translator fallback]: {e}")

    # Attempt 2: googletrans (from your original app.py)
    try:
        from googletrans import Translator
        translator = Translator()
        src = "mr" if source_lang == "auto" else source_lang
        res = translator.translate(clean_text, src=src, dest=target_lang)
        if res and res.text:
            return res.text
    except Exception as e:
        print(f"⚠️ [googletrans fallback]: {e}")

    # Attempt 3: Direct Google Translate GTX API (Zero extra libraries needed!)
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": source_lang,
            "tl": target_lang,
            "dt": "t",
            "q": clean_text
        }
        r = requests.get(url, params=params, timeout=10)
        if r.status_code == 200:
            data = r.json()
            return "".join([sentence[0] for sentence in data[0] if sentence[0]])
    except Exception as e:
        print(f"❌ [ALL TRANSLATORS FAILED]: {e}")

    return text

# Track the active language across voice and text requests
global_state["active_language"] = "English"

def detect_non_english_lang(text: str, requested_lang: str) -> str:
    """Robustly detects Marathi across all possible frontend payload variations."""
    req_clean = (requested_lang or "").strip().lower()
    
    # 1. Check all possible ways the React UI might label Marathi
    if req_clean in ["marathi", "mr", "mr-in", "मराठी"]:
        return "mr"
    if req_clean in ["hindi", "hi", "hi-in", "हिंदी"]:
        return "hi"
        
    # 2. Check if the user typed or spoke in Devanagari script
    if any('\u0900' <= char <= '\u097F' for char in text):
        return "mr"
        
    return "en"

class QueryRequest(BaseModel):
    question: str
    document_scope: Optional[list] = ["all"]
    is_voice: Optional[bool] = False
    language: Optional[str] = None
    lang: Optional[str] = None      # Catch alternative React key
    locale: Optional[str] = None    # Catch alternative React key

@app.post("/api/query")
@app.post("/api/query/")
async def handle_react_query(req: QueryRequest):
    if not global_state["faiss_index"]:
        raise HTTPException(status_code=400, detail="Please upload and index a document first.")

    user_query = req.question
    raw_lang = getattr(req, "language", None) or getattr(req, "lang", None) or getattr(req, "locale", None) or global_state.get("active_language", "English")
    lang_code = detect_non_english_lang(user_query, raw_lang)
    # Keep active_language synced with the UI toggle
    global_state["active_language"] = "Marathi" if lang_code == "mr" else "English"
    print(f"🌐 [LANGUAGE DETECTED]: {lang_code} (Raw UI input: {raw_lang})")
    
    # STEP 0: Translate query to English for search
    internal_query = user_query
    if lang_code != "en":
        internal_query = translate_text(user_query, source_lang="auto", target_lang="en")
        print(f"🔄 [TRANSLATED QUERY]: {internal_query}")

    # STEP 1.1: Conversational Context Memory (Reformulation)
    # Rewrite the internal English query using the previous chat history
    contextual_query = reformulate_query_with_memory(internal_query, global_state["chat_history"])

    # STEP 1.2: Multi-Hop Query Decomposition
    # Ask the LLM to break the complex query into 2 targeted sub-queries
    decomp_prompt = f"""Decompose this query into 2 simple, distinct search terms to find information in a document. 
    Query: {contextual_query}
    Output ONLY the 2 search terms on separate lines. No numbers or bullet points."""
    
    print("🔀 [MULTI-HOP] Decomposing query...")
    raw_sub_queries = query_ollama(decomp_prompt, temperature=0.0).split('\n')
    sub_queries = [q.strip() for q in raw_sub_queries if q.strip() and len(q) < 100][:2]
    
    if not sub_queries:
        sub_queries = [contextual_query]

    # STEP 1.3: Iterative Retrieval & Cross-Document Evidence Fusion
    # Run the hybrid search for the main query AND the sub-queries, fusing unique results
    all_candidates = []
    seen_texts = set()
    
    print(f"🔎 [FUSION] Searching hops for: {[contextual_query] + sub_queries}")
    for q in [contextual_query] + sub_queries:
        hop_candidates = get_hybrid_candidates(
            q, global_state["faiss_index"], global_state["bm25_index"], 
            global_state["chunks"], global_state["metadata"], top_k=3
        )
        
        for c in hop_candidates:
            # Evidence Fusion / Deduplication: Only keep the chunk if we haven't seen it yet
            if c['text'] not in seen_texts:
                seen_texts.add(c['text'])
                all_candidates.append(c)

    # Sort fused results by their hybrid score to keep the absolute best 5 chunks
    all_candidates.sort(key=lambda x: x.get('hybrid_score', 0), reverse=True)
    candidates = all_candidates[:5]

    if not candidates:
        no_info_msg = "या दस्तऐवजात संबंधित माहिती सापडली नाही." if lang_code == "mr" else "No relevant information found in the uploaded documents."
        return {
            "id": f"msg_empty_{abs(hash(user_query))}",
            "role": "assistant",
            "content": no_info_msg,
            "query": user_query,
            "answer": no_info_msg,
            "text": no_info_msg,
            "trust_score": 0,
            "confidenceScore": 0,
            "passed_verification": False,
            "sources": [],
            "citations": []
        }

    context_blocks = [f"[{c['meta']['source']} | Page: {c['meta']['page']}]\n{c['text']}" for c in candidates]
    context_str = "\n\n".join(context_blocks)
    
    # STEP 2: Generate Answer in English
    gen_prompt = f"""You are an expert analytical assistant. Use the following Context to answer the Question.
CRITICAL INSTRUCTION: Provide a detailed, comprehensive explanation based ONLY on the Context.
If nothing is relevant, output exactly: "I don't know."

Context:
{context_str}

Question: {internal_query}
Elaborate Answer in English:"""
    
    verified_english_answer = query_ollama(gen_prompt)
    
    # Fallback if local LLM returns empty string
    if not verified_english_answer or not verified_english_answer.strip():
        verified_english_answer = "Based on the uploaded document:\n" + "\n".join(
            [f"- {c['text'][:300]}..." for c in candidates[:2]]
        )

    # STEP 3: NLI Verification
    if "i don't know" in verified_english_answer.lower():
        trust_score = 1.0 
    else:
        judge_prompt = f"Context: {context_str}\n\nClaim: {verified_english_answer}\n\nIs the Claim supported by the Context? Reply with ONLY YES or NO."
        judge_res = query_ollama(judge_prompt, temperature=0.0).upper()
        trust_score = 0.0 if "NO" in judge_res else 1.0

    passed_verification = trust_score == 1.0
    final_display_answer = verified_english_answer

    # STEP 4: Translate Output to Selected Language (Marathi)
    if not passed_verification:
        final_display_answer = (
            "⚠️ भ्रम सुरक्षा सक्रिय (Hallucination Guard Triggered)! पुराव्यानिशी उत्तर पडताळता आले नाही."
            if lang_code == "mr" else
            "⚠️ Hallucination Guard Triggered! The AI generated an answer, but it could not be verified against the source documents."
        )
    elif lang_code != "en" and "i don't know" not in verified_english_answer.lower():
        final_display_answer = translate_text(verified_english_answer, source_lang="en", target_lang=lang_code)

    # STEP 5: Format Citations AND Append Retrieved Chunks Under the Response
    formatted_citations = []
    if passed_verification and "i don't know" not in verified_english_answer.lower():
        seen = set()
        chunks_header = "\n\n---\n📄 **संदर्भ आणि मूळ उतारे (Retrieved Chunks):**\n" if lang_code == "mr" else "\n\n---\n📄 **Retrieved Context Chunks:**\n"
        appended_chunks_text = chunks_header

        for idx, c in enumerate(candidates):
            doc_name = c['meta']['source']
            page_num = str(c['meta']['page'])
            section_name = c['meta'].get('section', f"Page {page_num}, Segment {idx + 1}")
            chunk_text = c['text']
            
            unique_key = f"{doc_name}_{page_num}_{idx}"
            if unique_key not in seen:
                seen.add(unique_key)
                
                short_snippet = chunk_text[:300].replace("\n", " ") + ("..." if len(chunk_text) > 300 else "")
                if lang_code != "en":
                    translated_snippet = translate_text(short_snippet, source_lang="en", target_lang=lang_code)
                    display_snippet = f"{translated_snippet}\n*(Original: \"{short_snippet}\")*"
                else:
                    display_snippet = f"\"{short_snippet}\""

                appended_chunks_text += f"\n🔹 **[{idx + 1}] {doc_name} (Page {page_num})**:\n{display_snippet}\n"

                formatted_citations.append({
                    "id": doc_name,
                    "documentId": doc_name,
                    "documentName": doc_name,
                    "fileName": doc_name,
                    "title": f"{doc_name} (Page {page_num})",
                    "source": doc_name,
                    "page": page_num,
                    "pageNumber": page_num,
                    "section": section_name,
                    "snippet": display_snippet if lang_code != "en" else chunk_text,
                    "excerpt": chunk_text,
                    "text": chunk_text,
                    "content": chunk_text,
                    "fullContent": chunk_text,
                    "highlight": chunk_text,
                    "confidence": 95
                })
        
        final_display_answer += appended_chunks_text

    import datetime
    timestamp = datetime.datetime.now().strftime("%I:%M %p")

    # Format the entry exactly how your History.tsx expects it
    history_entry = {
        "id": f"hist_{abs(hash(final_display_answer))}",
        "question": user_query,
        "answerSummary": final_display_answer,
        "confidence": round(trust_score * 100),
        "sourcesCount": len(formatted_citations),
        "timestamp": timestamp,
        "relativeTime": "Just now"
    }
    
    # Save it to the backend memory
    global_state["chat_history"].insert(0, history_entry) # Insert at the top
    
    # CRITICAL: This return statement MUST be aligned with the outer function (4 spaces), NOT inside the 'if' block!
    return {
        "id": f"msg_{abs(hash(final_display_answer))}", 
        "role": "assistant",
        "content": final_display_answer,
        "query": user_query,
        "answer": final_display_answer,
        "text": final_display_answer,
        "trust_score": trust_score * 100,
        "confidenceScore": trust_score * 100,
        "passed_verification": passed_verification,
        "citations": formatted_citations,
        "sources": formatted_citations
    }

@app.post("/api/documents/upload")
@app.post("/api/documents/upload/")
async def upload_documents(files: List[UploadFile] = File(...)):
    allowed_extensions = ('.pdf', '.docx', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.webp')
    uploaded_docs = []
    
    for file in files:
        if not file.filename.lower().endswith(allowed_extensions):
             raise HTTPException(
                 status_code=400, 
                 detail=f"Unsupported file type. Please upload one of: {', '.join(allowed_extensions)}"
             )
        
        if file.filename not in global_state["processed_filenames"]:
            file_bytes = await file.read()
            c, m = process_document(file_bytes, file.filename, len(global_state["chunks"]))
            if c:
                global_state["chunks"].extend(c)
                global_state["metadata"].extend(m)
                global_state["processed_filenames"].add(file.filename)
                file_ext = file.filename.split('.')[-1] if '.' in file.filename else "doc"
                doc_info = {
                    "id": file.filename, 
                    "name": file.filename, 
                    "type": file_ext,  
                    "status": "indexed",
                    "chunksCount": len(c)
                }
                uploaded_docs.append(doc_info)
                global_state["indexed_documents"].append(doc_info)
                
    if uploaded_docs and global_state["chunks"]:
        global_state["faiss_index"], global_state["bm25_index"] = build_indices(global_state["chunks"])
        
    return uploaded_docs

@app.get("/api/documents")
@app.get("/api/documents/")
async def get_documents():
    return global_state["indexed_documents"]


def convert_to_pcm_wav(audio_bytes: bytes) -> bytes:
    """Converts browser WebM/Opus/MP4 audio bytes into standard 16kHz Mono PCM WAV."""
    import av
    input_container = av.open(io.BytesIO(audio_bytes))
    output_buffer = io.BytesIO()
    
    with wave.open(output_buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)  # 16-bit PCM
        wav_file.setframerate(16000)
        
        resampler = av.AudioResampler(format='s16', layout='mono', rate=16000)
        for frame in input_container.decode(audio=0):
            for resampled_frame in resampler.resample(frame):
                wav_file.writeframes(resampled_frame.to_ndarray().tobytes())
                
    return output_buffer.getvalue()

import concurrent.futures
from fastapi import Request, Query

class LanguageSyncRequest(BaseModel):
    language: str

@app.post("/api/language")
@app.post("/api/language/")
@app.post("/api/settings/language")
async def sync_ui_language(req: LanguageSyncRequest):
    """Instantly locks the backend language the millisecond the user clicks the UI dropdown."""
    clean = req.language.strip().lower()
    global_state["active_language"] = "Marathi" if clean in ["marathi", "mr", "mr-in", "मराठी"] else "English"
    print(f"🔄 [UI LANGUAGE SYNCED]: {global_state['active_language']}")
    return {"status": "ok", "language": global_state["active_language"]}

@app.post("/api/voice/transcribe")
@app.post("/api/voice/transcribe/")
async def transcribe_voice(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("English")
):
    """Transcribes audio using Google Speech API with case-insensitive language matching."""
    try:
        raw_bytes = await audio.read()
        
        # Convert browser WebM/Opus audio to standard PCM WAV
        try:
            wav_bytes = convert_to_pcm_wav(raw_bytes)
        except Exception:
            wav_bytes = raw_bytes  # Fallback if already valid WAV

        recognizer = sr.Recognizer()
        with sr.AudioFile(io.BytesIO(wav_bytes)) as source:
            audio_data = recognizer.record(source)
            
            # 1. Make language matching case-insensitive and support both full names & codes
            lang_input = (language or "English").strip().lower()
            
            if "marathi" in lang_input or lang_input == "mr":
                speech_lang = "mr-IN"
            elif "hindi" in lang_input or lang_input == "hi":
                speech_lang = "hi-IN"
            else:
                speech_lang = "en-IN"  # Default to English
                
            print(f"🎤 [VOICE TRANSCRIPTION] Selected UI Language: '{language}' -> Google Speech Lang: '{speech_lang}'")
            
            # 2. Transcribe strictly using the user's selected language
            transcribed_text = recognizer.recognize_google(audio_data, language=speech_lang)
                
        return {"text": transcribed_text, "transcript": transcribed_text}
        
    except sr.UnknownValueError:
        raise HTTPException(
            status_code=400, 
            detail="Could not understand audio. Please speak clearly and check your microphone."
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transcription error: {str(e)}")

@app.get("/api/documents/{doc_id}/preview")
@app.get("/api/documents/{doc_id}/preview/")
async def preview_document(doc_id: str, page: Optional[str] = None):
    """Returns extracted text segments even if frontend passes '{id}' literally."""
    matched_chunks = []
    target_doc = doc_id

    # If the frontend passes literal '{id}', fallback to the first uploaded document
    if doc_id in ["{id}", "undefined", "null"] and global_state["indexed_documents"]:
        target_doc = global_state["indexed_documents"][0]["id"]

    for idx, meta in enumerate(global_state["metadata"]):
        if meta["source"] == target_doc:
            if page is None or page in ["Auto", "undefined"] or str(meta["page"]) == str(page):
                if idx < len(global_state["chunks"]):
                    matched_chunks.append(global_state["chunks"][idx])

    # Fallback: if page filter was too strict, return the first 3 chunks of the document
    if not matched_chunks:
        for idx, meta in enumerate(global_state["metadata"]):
            if meta["source"] == target_doc and idx < len(global_state["chunks"]):
                matched_chunks.append(global_state["chunks"][idx])
                if len(matched_chunks) >= 3:
                    break

    real_text = "\n\n".join(matched_chunks) if matched_chunks else "No text available. Please re-upload the document."
    
    return {
        "id": target_doc,
        "documentId": target_doc,
        "title": target_doc,
        "documentName": target_doc,
        "page": page or "1",
        "section": f"Page {page or '1'}",
        "text": real_text,
        "content": real_text,
        "excerpt": real_text,
        "snippet": real_text,
        "fullContent": real_text,
        "highlight": matched_chunks[0] if matched_chunks else real_text
    }

@app.get("/api/history")
@app.get("/api/history/")
async def get_history():
    """Returns the saved chat history to the React dashboard and History tab."""
    return global_state["chat_history"]

@app.delete("/api/documents/{doc_id}")
@app.delete("/api/documents/{doc_id}/")
async def delete_document(doc_id: str):
    return {"status": "success"}

@app.get("/api/health")
@app.get("/api/health/")
async def health_check():
    return {"status": "ok"}