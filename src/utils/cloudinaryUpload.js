const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


export function getCloudinaryConfig() {
    return {cloudName, uploadPreset};
}

export function isCloudinaryConfigured() {
    return Boolean(cloudName && uploadPreset);
}





export function getCloudinaryUploadUrl(file) {
    if (!cloudName) {
        throw new Error("Thiếu VITE_CLOUDINARY_CLOUD_NAME");
    }
    const mime = file?.type || "";
    const isImage = mime.startsWith("image/");
    const resource = isImage ? "image" : "raw";
    return `https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`;
}





export async function uploadFileToCloudinary(file) {
    if (!isCloudinaryConfigured()) {
        throw new Error("Thiếu VITE_CLOUDINARY_CLOUD_NAME hoặc VITE_CLOUDINARY_UPLOAD_PRESET trong file .env");
    }
    const url = getCloudinaryUploadUrl(file);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(url, {method: "POST", body: formData});
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
        const msg =
            (typeof data.error === "object" && data.error?.message) ||
            (typeof data.error === "string" && data.error) ||
            `Upload thất bại (${res.status})`;
        throw new Error(msg);
    }
    if (!data.secure_url) {
        throw new Error("Phản hồi từ Cloudinary không có secure_url");
    }

    return {
        url: data.secure_url,
        type: data.resource_type || (file.type?.startsWith("image/") ? "image" : "raw"),
        publicId: data.public_id,
        format: data.format,
        bytes: data.bytes,
    };
}




export async function uploadFilesToCloudinary(files) {
    return Promise.all(files.map((f) => uploadFileToCloudinary(f)));
}
