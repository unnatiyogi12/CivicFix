import { useState } from "react";
import "./ImageUpload.css";

function ImageUpload() {

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);

    const imageUrl = URL.createObjectURL(file);

    setPreview(imageUrl);
  };


  return (
    <div className="image-section">

      <h3>📷 Add Evidence</h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />


      {/* Image Preview */}

      {preview && (
        <div className="preview-section">

          <h3>Image Preview</h3>

          <img
            src={preview}
            alt="Complaint evidence"
            className="preview-image"
          />

          <p>
            Selected: {image?.name}
          </p>

        </div>
      )}

    </div>
  );
}

export default ImageUpload;