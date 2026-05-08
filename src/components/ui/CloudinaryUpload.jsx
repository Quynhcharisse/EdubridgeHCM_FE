import React, {useId, useState} from "react";
import {uploadFilesToCloudinary} from "../../utils/cloudinaryUpload.js";
import {
    acceptDeclaresImageOnly,
    shouldApplyMediaImageValidation,
    validateMediaImageFile,
} from "../../utils/platformMediaConfig.js";















export default function CloudinaryUpload({
    onSuccess,
    onError,
    accept = "image/*,application/pdf",
    multiple = true,
    disabled = false,
    mediaImageRules,
    mediaImageRulesLoading = false,
    inputId: inputIdProp,
    children,
}) {
    const genId = useId();
    const inputId = inputIdProp ?? `cloudinary-file-${genId.replace(/:/g, "")}`;
    const [loading, setLoading] = useState(false);

    const handleChange = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;

        const imageOnly = acceptDeclaresImageOnly(accept);
        if (mediaImageRules !== undefined && imageOnly) {
            if (mediaImageRulesLoading) {
                onError?.("Đang tải cấu hình giới hạn ảnh…");
                return;
            }
            if (!mediaImageRules) {
                onError?.("Chưa tải được cấu hình ảnh từ hệ thống. Vui lòng thử lại sau.");
                return;
            }
            for (const file of files) {
                if (!shouldApplyMediaImageValidation(file, accept)) continue;
                const v = validateMediaImageFile(file, mediaImageRules);
                if (!v.ok) {
                    onError?.(v.message);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            const results = await uploadFilesToCloudinary(files);
            onSuccess?.(results);
        } catch (err) {
            const message = err?.message || "Upload thất bại";
            onError?.(message);
            console.error("Cloudinary upload:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <input
                id={inputId}
                type="file"
                hidden
                accept={accept}
                multiple={multiple}
                disabled={disabled || loading}
                onChange={handleChange}
            />
            {typeof children === "function" ? children({inputId, loading}) : children}
        </>
    );
}
