import {useCallback, useState} from 'react';
import {enqueueSnackbar} from 'notistack';
import {isCloudinaryConfigured, uploadFileToCloudinary} from '../../../utils/cloudinaryUpload.js';
import {formatBytes, isAllowedImage, MAX_IMAGE_BYTES} from './admissionSubmissionUtils.js';

export function useAdmissionDocumentUpload(setDocs) {
    const cloudinaryReady = isCloudinaryConfigured();
    const [uploadingSlots, setUploadingSlots] = useState(() => new Set());

    const setSlotUploading = useCallback((slotKey, isUploading) => {
        setUploadingSlots((prev) => {
            const next = new Set(prev);
            if (isUploading) next.add(slotKey);
            else next.delete(slotKey);
            return next;
        });
    }, []);

    const handlePickFile = useCallback(
        async (docIndex, slotIndex, file) => {
            if (!file) return;
            if (!cloudinaryReady) {
                enqueueSnackbar('Chưa cấu hình Cloudinary, không thể tải ảnh lên.', {variant: 'error'});
                return;
            }
            if (!isAllowedImage(file)) {
                enqueueSnackbar('Chỉ hỗ trợ định dạng ảnh JPG, JPEG, PNG, WEBP.', {variant: 'warning'});
                return;
            }
            if (file.size > MAX_IMAGE_BYTES) {
                enqueueSnackbar(`Ảnh vượt quá ${formatBytes(MAX_IMAGE_BYTES)}, vui lòng chọn ảnh nhỏ hơn.`, {
                    variant: 'warning',
                });
                return;
            }
            const slotKey = `${docIndex}-${slotIndex}`;
            setSlotUploading(slotKey, true);
            try {
                const result = await uploadFileToCloudinary(file);
                setDocs((prev) => {
                    const next = prev.slice();
                    const target = next[docIndex];
                    if (!target) return prev;
                    const slots = target.slots.slice();
                    slots[slotIndex] = result.url;
                    next[docIndex] = {...target, slots};
                    return next;
                });
            } catch (err) {
                enqueueSnackbar(err?.message || 'Tải ảnh lên thất bại, vui lòng thử lại.', {variant: 'error'});
            } finally {
                setSlotUploading(slotKey, false);
            }
        },
        [cloudinaryReady, setDocs, setSlotUploading],
    );

    const handleRemoveSlot = useCallback(
        (docIndex, slotIndex) => {
            setDocs((prev) => {
                const next = prev.slice();
                const target = next[docIndex];
                if (!target) return prev;
                const slots = target.slots.slice();
                slots[slotIndex] = null;
                next[docIndex] = {...target, slots};
                return next;
            });
        },
        [setDocs],
    );

    return {
        cloudinaryReady,
        uploadingSlots,
        anyUploading: uploadingSlots.size > 0,
        handlePickFile,
        handleRemoveSlot,
    };
}
