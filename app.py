import gc
import json
import csv
import io
import time
import streamlit as st
import requests
import gc
import tempfile
from ingestion import process_document, build_indices
from retriever import get_hybrid_candidates

st.set_page_config(page_title="Multilingual AI Knowledge Base", layout="wide")
OLLAMA_BASE_URL = "http://127.0.0.1:11434"

# Initialize Session State (Conversational Memory & DB)
for key in ["chat_history", "faiss_index", "bm25_index", "chunks", "metadata", "processed_filenames"]:
    if key not in st.session_state:
        st.session_state[key] = [] if key not in ["faiss_index", "bm25_index", "processed_filenames"] else (None if key != "processed_filenames" else set())

def query_ollama(prompt: str, temperature: float = 0.1) -> str:
    """Standardized Ollama call with keep_alive: 0 to prevent 8GB RAM overflow."""
    payload = {
        "model": "llama3.2:1b",
        "prompt": prompt,
        "stream": False,
        "keep_alive": 0,  # CRITICAL: Forces instant RAM eviction after generation
        "options": {"num_ctx": 2048, "temperature": temperature}
    }
    try:
        res = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload, timeout=120)
        return res.json().get("response", "").strip() if res.status_code == 200 else ""
    except Exception:
        return ""

def verify_nli(answer: str, context: str) -> float:
    """Trust-Aware Verification: Cross-lingual optimized for 3B parameter models."""
    if "do not contain the answer" in answer.lower() or "insufficient" in answer.lower():
        return 1.0  # Trust is 100% because it successfully abstained

    # Explicitly inform the 1B model about the language translation
    prompt = f"""You are a strict grading system. 
    The Context below is in English. 
    The Generated Answer may be translated into another language (like Marathi).
    
    Context: {context}
    
    Generated Answer: {answer}
    
    Does the English Context logically support the facts stated in the Generated Answer? 
    Answer strictly with a single word: YES or NO."""
    
    res = query_ollama(prompt, temperature=0.0).upper()
    
    # Check for variations in case the LLM includes punctuation
    if "YES" in res or "TRUE" in res:
        return 1.0
    else:
        return 0.0

# --- UI Layout ---
with st.sidebar:
    st.title("Knowledge Base Setup")
    # Expand accepted file types
    uploaded_files = st.file_uploader(
        "Upload Documents", 
        type=["pdf", "docx", "txt", "csv"], 
        accept_multiple_files=True
    )
    
    if st.button("Process & Index"):
        if uploaded_files:
            for file in uploaded_files:
                if file.name not in st.session_state.processed_filenames:
                    with st.spinner(f"Indexing '{file.name}'..."):
                        # Use the new universal function
                        c, m = process_document(file.read(), file.name, len(st.session_state.chunks))
                        
                        if c:
                            st.session_state.chunks.extend(c)
                            st.session_state.metadata.extend(m)
                            st.session_state.processed_filenames.add(file.name)
                            
            if st.session_state.chunks:
                st.session_state.faiss_index, st.session_state.bm25_index = build_indices(st.session_state.chunks)
                st.success(f"Successfully indexed {len(uploaded_files)} files!")
            else:
                st.error("Failed to extract text from the uploaded files.")
        else:
            st.warning("Please upload at least one file first.")

    st.divider()
    st.markdown("### 💾 Export Conversation")
    
    if st.session_state.chat_history:
        # 1. Prepare TXT Data
        txt_data = "=== Chat History ===\n\n"
        for msg in st.session_state.chat_history:
            role = "👤 User" if msg['role'] == 'user' else "🤖 AI"
            txt_data += f"{role}:\n{msg['content']}\n\n"
        
        st.download_button(
            label="📄 Download as TXT",
            data=txt_data.encode('utf-8'),
            file_name="chat_history.txt",
            mime="text/plain",
            use_container_width=True
        )
        
        # 2. Prepare JSON Data (Great for system logs)
        json_data = json.dumps(st.session_state.chat_history, indent=4, ensure_ascii=False)
        st.download_button(
            label="🧩 Download as JSON",
            data=json_data.encode('utf-8'),
            file_name="chat_history.json",
            mime="application/json",
            use_container_width=True
        )
        
        # 3. Prepare CSV Data (Spreadsheet format)
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(["Role", "Content", "Trust Score"])
        for msg in st.session_state.chat_history:
            writer.writerow([msg.get('role', ''), msg.get('content', ''), msg.get('trust_score', 'N/A')])
            
        st.download_button(
            label="📊 Download as CSV",
            # Note: utf-8-sig ensures Excel correctly displays Marathi/Hindi characters
            data=csv_buffer.getvalue().encode('utf-8-sig'), 
            file_name="chat_history.csv",
            mime="text/csv",
            use_container_width=True
        )
    else:
        st.info("Start chatting to enable downloads.")

st.title("AI-Powered Knowledge Retrieval System")

for chat in st.session_state.chat_history:
    with st.chat_message(chat["role"]):
        st.markdown(chat["content"])
        if "trust_score" in chat:
            st.progress(chat["trust_score"], text=f"Trust Score: {int(chat['trust_score']*100)}%")

# Explicit Language Selection
st.markdown("### Ask a Question")
lang_map = {"English": "en", "Marathi": "mr"}
selected_lang = st.radio("Select Query Language:", list(lang_map.keys()), horizontal=True)
lang_code = lang_map[selected_lang]

# Input Handlers (Voice and Text)
query_text = st.chat_input(f"Type your question in {selected_lang}...")
audio_bytes = st.audio_input(f"Or record a voice query in {selected_lang}")
user_query = None

if audio_bytes:
    with st.spinner(f"Transcribing Voice ({selected_lang})..."):
        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            
            # Read the audio bytes directly from Streamlit
            with sr.AudioFile(audio_bytes) as source:
                audio_data = recognizer.record(source)
                
                # Use highly accurate regional codes for Google API
                speech_lang = "mr-IN" if selected_lang == "Marathi" else "en-US"
                
                # Transcribe using Google's free voice engine
                user_query = recognizer.recognize_google(audio_data, language=speech_lang)
                
        except sr.UnknownValueError:
            st.error("Could not understand the audio. Please try speaking clearly.")
            user_query = None
        except sr.RequestError:
            st.error("Speech recognition service is unavailable. Please check your internet connection.")
            user_query = None
        except Exception as e:
            st.error(f"Audio processing error: {e}")
            user_query = None

if query_text:
    user_query = query_text

# Pipeline Execution
if user_query:
    if not st.session_state.faiss_index:
        st.warning("Please upload and index a document first.")
    else:
        with st.chat_message("user"):
            st.markdown(user_query)
        
        st.session_state.chat_history.append({"role": "user", "content": user_query})
        if len(st.session_state.chat_history) > 6:
            st.session_state.chat_history = st.session_state.chat_history[-6:]

        with st.chat_message("assistant"):
            
            # STEP 0: Pre-Translate the user's query into English for accurate search
            internal_query = user_query
            if selected_lang != "English":
                with st.spinner("Preparing query..."):
                    try:
                        from googletrans import Translator
                        translator = Translator()
                        # Force translation strictly from Marathi/Hindi to English
                        source_code = "mr" if selected_lang == "Marathi" else "hi"
                        translated_q = translator.translate(user_query, src=source_code, dest='en')
                        internal_query = translated_q.text
                        st.caption(f"*(Searching PDF for: '{internal_query}')*")
                    except Exception:
                        pass # Fallback to original if API fails

            with st.spinner("Processing Context & Retrieving..."):
                # CRITICAL: Pass 'internal_query' to the search function
                candidates = get_hybrid_candidates(
                    internal_query, st.session_state.faiss_index, st.session_state.bm25_index, 
                    st.session_state.chunks, st.session_state.metadata, top_k=6
                )

                if not candidates:
                    st.warning("No relevant information found.")
                else:
                    context_blocks = []
                    for c in candidates:
                        context_blocks.append(f"[{c['meta']['source']} | Page: {c['meta']['page']}]\n{c['text']}")
                    context_str = "\n\n".join(context_blocks)
                    
                    # STEP 1: Generate in English for accurate verification
                    with st.spinner("Synthesizing Answer (English Base)..."):
                        gen_prompt = f"""You are an expert analytical assistant. Use the following Context to answer the Question.
                        
                        CRITICAL INSTRUCTION: You must provide a highly elaborate, detailed, and comprehensive explanation. Do not give short summaries. Extract all relevant points, lists, and nuances from the context.
                        If the exact answer is not explicitly written, you are allowed to elaborate on related goals, scope, or features found IN THE CONTEXT ONLY.
                        If absolutely nothing is relevant to the user's question, output exactly: "I don't know."
                        
                        Context:
                        {context_str}
                        
                        Question: {internal_query}
                        Elaborate Answer in English:"""
                        
                        # ACTUALLY GENERATE THE ANSWER HERE
                        verified_english_answer = query_ollama(gen_prompt)
                    
                    # STEP 2: English-on-English NLI Verification (Highly reliable)
                    with st.spinner("Verifying Factual Accuracy..."):
                        if "I don't know" in verified_english_answer:
                            trust_score = 1.0 # Abstained correctly
                        else:
                            judge_prompt = f"Context: {context_str}\n\nClaim: {verified_english_answer}\n\nIs the Claim supported by the Context? Reply with ONLY the word YES or NO."
                            judge_res = query_ollama(judge_prompt, temperature=0.0).upper()
                            
                            trust_score = 1.0 if "YES" in judge_res else 0.0
                            
                            st.sidebar.markdown("### 🛠️ Debug Info")
                            st.sidebar.warning(f"**Raw Judge Output:** {judge_res}")

                    # STEP 3: Translate to selected language ONLY if verified
                    final_display_answer = verified_english_answer

                    if trust_score < 1.0:
                        st.error("⚠️ Hallucination Guard Triggered!")
                        st.markdown(f"**LLM Generated This (Failed):**\n{verified_english_answer}")
                    else:
                        st.success("✅ Answer Verified!")
                        
                        # Trigger Pure-Python Translation if Marathi or Hindi is selected
                        if selected_lang != "English" and "I don't know" not in verified_english_answer:
                            with st.spinner(f"Translating to {selected_lang}..."):
                                try:
                                    from googletrans import Translator
                                    translator = Translator()
                                    target_code = "mr" if selected_lang == "Marathi" else "hi"
                                    
                                    # Force translation strictly from English to target language
                                    translated = translator.translate(verified_english_answer, src='en', dest=target_code)
                                    final_display_answer = translated.text
                                except Exception as e:
                                    st.warning("Translation API failed. Showing English fallback.")
                                    final_display_answer = verified_english_answer
                        
                        # --- NEW: Safely Append Citations ---
                        if "I don't know" not in verified_english_answer:
                            # Gather unique document names and pages from the retrieved context
                            unique_sources = list(set([f"{c['meta']['source']} (Page {c['meta']['page']})" for c in candidates]))
                            
                            # Localize the "Sources" header based on user's language selection
                            citation_label = "Sources" if selected_lang == "English" else ("संदर्भ" if selected_lang == "Marathi" else "स्रोत")
                            
                            citations_md = f"\n\n**{citation_label}:**\n"
                            for src in unique_sources:
                                citations_md += f"- {src}\n"
                                
                            # Attach the citations directly to the final answer
                            final_display_answer += citations_md

                        # Display the final text (with citations) to the UI
                        st.markdown(final_display_answer)
                        if selected_lang != "English":
                            st.caption(f"*(Original English Context: {verified_english_answer})*")

                    # STEP 4: Save the interaction (and citations) to chat memory so it persists
                    st.session_state.chat_history.append({
                        "role": "assistant",
                        "content": final_display_answer,
                        "trust_score": trust_score
                    })