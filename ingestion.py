import io
import csv
import docx
import base64
import requests
import fitz  # Pymupdf
import numpy as np
import faiss
from rank_bm25 import BM25Okapi
from fastembed import TextEmbedding
from langchain_text_splitters import RecursiveCharacterTextSplitter

embed_model = TextEmbedding(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

semantic_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=150,
    separators=["\n\n", "\n", ". ", " ", ""]
)

OLLAMA_BASE_URL = "http://127.0.0.1:11434"

def describe_image_with_moondream(image_bytes: bytes) -> str:
    """Uses Moondream to convert image bytes into text, instantly evicting from RAM after."""
    b64_img = base64.b64encode(image_bytes).decode('utf-8')
    payload = {
        "model": "moondream",
        "prompt": "Describe this image in detail, including any text, charts, diagrams, or numbers visible. Be comprehensive.",
        "stream": False,
        "keep_alive": 0, # CRITICAL: Instantly unloads Moondream from RAM
        "options": {"temperature": 0.1}
    }
    try:
        res = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload, timeout=120)
        return res.json().get("response", "").strip() if res.status_code == 200 else ""
    except Exception as e:
        print(f"❌ [VISION ERROR]: {e}")
        return ""

def process_document(file_bytes: bytes, file_name: str, start_chunk_id: int):
    """Parses text AND images from PDFs, DOCX, TXT, CSV, and standalone Images."""
    chunks = []
    metadata = []
    chunk_counter = 0

    try:
        # 1. STANDALONE IMAGE UPLOAD
        if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            print(f"🖼️ [VISION] Analyzing standalone image '{file_name}'...")
            img_description = describe_image_with_moondream(file_bytes)
            extracted_text = f"Image description for {file_name}: {img_description}"
            
            raw_chunks = semantic_splitter.split_text(extracted_text)
            for i, chunk_text in enumerate(raw_chunks):
                if len(chunk_text.strip()) > 10:
                    chunks.append(chunk_text.strip())
                    metadata.append({
                        "source": file_name,
                        "chunk_id": start_chunk_id + i,
                        "page": "1",
                        "section": "Image Content"
                    })
        
        # 2. PDF DOCUMENT (TEXT + IN-DOCUMENT IMAGES)
        elif file_name.lower().endswith('.pdf'):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                page_text = page.get_text() or ""
                
                # Extract images from this specific page
                image_list = page.get_images(full=True)
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    img_bytes = base_image["image"]
                    
                    print(f"🖼️ [VISION] Analyzing image {img_index+1} on page {page_idx+1} of '{file_name}'...")
                    img_description = describe_image_with_moondream(img_bytes)
                    if img_description:
                        # Append the visual description seamlessly into the page's text context
                        page_text += f"\n\n[Visual Content on Page {page_idx+1}]: {img_description}\n\n"
                
                # Chunk the combined text and image descriptions
                page_chunks = semantic_splitter.split_text(page_text)
                for chunk_text in page_chunks:
                    if len(chunk_text.strip()) > 30:
                        chunks.append(chunk_text.strip())
                        metadata.append({
                            "source": file_name,
                            "chunk_id": start_chunk_id + chunk_counter,
                            "page": str(page_idx + 1),
                            "section": f"Page {page_idx + 1}, Segment {chunk_counter + 1}"
                        })
                        chunk_counter += 1
                        
        # 3. STANDARD TEXT FILES (DOCX, TXT, CSV)
        else:
            extracted_text = ""
            if file_name.lower().endswith('.docx'):
                doc = docx.Document(io.BytesIO(file_bytes))
                extracted_text = "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            elif file_name.lower().endswith('.txt'):
                extracted_text = file_bytes.decode('utf-8', errors='ignore')
            elif file_name.lower().endswith('.csv'):
                decoded_file = file_bytes.decode('utf-8', errors='ignore').splitlines()
                reader = csv.reader(decoded_file)
                extracted_text = "\n".join([" | ".join(row) for row in reader])
            else:
                raise ValueError(f"Unsupported file format: {file_name}")

            raw_chunks = semantic_splitter.split_text(extracted_text)
            for i, chunk_text in enumerate(raw_chunks):
                if len(chunk_text.strip()) > 30:
                    chunks.append(chunk_text.strip())
                    metadata.append({
                        "source": file_name,
                        "chunk_id": start_chunk_id + i,
                        "page": "1",
                        "section": f"Segment {i + 1}"
                    })

        return chunks, metadata

    except Exception as e:
        print(f"Error processing {file_name}: {e}")
        return [], []

def build_indices(chunks: list[str]):
    if not chunks:
        return None, None
    embeddings = list(embed_model.embed(chunks))
    embedding_matrix = np.array(embeddings, dtype="float32")
    faiss.normalize_L2(embedding_matrix)
    dimension = embedding_matrix.shape[1]
    faiss_index = faiss.IndexFlatIP(dimension)
    faiss_index.add(embedding_matrix)
    tokenized_corpus = [chunk.lower().split() for chunk in chunks]
    bm25_index = BM25Okapi(tokenized_corpus)
    return faiss_index, bm25_index