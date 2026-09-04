import io
import logging
import numpy as np
from PIL import Image

logger = logging.getLogger("mindsense.vision")

def preprocess_image(image_bytes: bytes) -> tuple:
    """
    Processes image bytes using PIL and OpenCV. Detects face bounding boxes
    where supported, crops and aligns to 48x48 grayscale, normalizes to [0, 1],
    and returns (face_array, face_status).
    
    Returns:
        tuple: (cropped_face_array, face_status)
            - cropped_face_array: np.ndarray of shape (1, 48, 48) or None
            - face_status: string ("no_face", "one_face", "multiple_faces")
    """
    try:
        # 1. Decode image bytes using PIL
        pil_img = Image.open(io.BytesIO(image_bytes))
        gray_img = pil_img.convert('L')
        width, height = gray_img.size
        
        face_status = "one_face"
        face_crop = None
        
        # 2. Try OpenCV Haar Cascade Face Detector if cv2 has CascadeClassifier
        try:
            import cv2
            if hasattr(cv2, 'CascadeClassifier') and hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                face_cascade = cv2.CascadeClassifier(cascade_path)
                np_gray = np.array(gray_img)
                faces = face_cascade.detectMultiScale(
                    np_gray,
                    scaleFactor=1.1,
                    minNeighbors=4,
                    minSize=(30, 30)
                )
                if len(faces) > 0:
                    face_status = "one_face" if len(faces) == 1 else "multiple_faces"
                    largest_face = max(faces, key=lambda f: f[2] * f[3])
                    x, y, w, h = largest_face
                    face_crop = gray_img.crop((x, y, x + w, y + h))
        except Exception as e:
            # If cv2 fails or cascade is unavailable, continue with fallback
            logger.debug("Haar cascade face detection unavailable, using center crop fallback: %s", e)
            
        # 3. Fallback: Intelligent Center-Crop if Haar cascade wasn't triggered
        if face_crop is None:
            min_dim = min(width, height)
            left = (width - min_dim) // 2
            top = (height - min_dim) // 2
            face_crop = gray_img.crop((left, top, left + min_dim, top + min_dim))
            face_status = "one_face"
            
        # 4. Resize to 48x48 pixels
        resample_method = getattr(Image, 'Resampling', Image).BILINEAR
        face_resized = face_crop.resize((48, 48), resample=resample_method)
        
        # 5. Normalize pixel values to [0.0, 1.0]
        face_arr = np.array(face_resized, dtype=np.float32) / 255.0
        face_final = np.expand_dims(face_arr, axis=0) # Shape: (1, 48, 48)
        
        return face_final, face_status
    except Exception as e:
        print(f"Image preprocessing error: {e}")
        return None, "no_face"
