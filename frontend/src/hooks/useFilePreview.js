import { useEffect, useState } from 'react';

// Local previews do not fetch the private storage reference returned by upload.
export default function useFilePreview() {
  const [preview, setPreview] = useState(null);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);
  const showFile = file => setPreview(file ? { url: URL.createObjectURL(file), type: file.type } : null);
  return { preview, showFile };
}
