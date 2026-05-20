import React from 'react';
import {Box, Divider, Stack, Typography} from '@mui/material';
import {AdmissionDocumentsSection} from './AdmissionDocumentUploadFields.jsx';
import StudentProfilePicker from './StudentProfilePicker.jsx';
import {SECTION_LABEL_SX} from './admissionSubmissionUtils.js';

function InfoRow({label, value}) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{lineHeight: 1.65}}>
            <Typography
                sx={{
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#475569',
                    minWidth: 130,
                    flexShrink: 0,
                }}
            >
                {label}:
            </Typography>
            <Typography sx={{fontSize: '0.96rem', color: '#0f172a', fontWeight: 600}}>
                {value || '—'}
            </Typography>
        </Stack>
    );
}

export default function AdmissionSubmissionFormContent({
    students,
    studentLoading,
    studentError,
    selectedStudentId,
    onSelectStudent,
    studentSectionTitle,
    docs,
    docsLoading,
    docsError,
    cloudinaryReady,
    uploadingSlots,
    disabled,
    studentPickerDisabled,
    onPickFile,
    onRemoveSlot,
    documentsSectionTitle = 'Hồ sơ cần nộp',
    documentsHint,
    showSchoolContext = false,
    schoolName,
    campaignName,
    programName,
    showParentInfo = false,
    parentInfo,
    studentDetailContent,
}) {
    const studentTitle = studentSectionTitle ?? 'Học sinh';

    return (
        <Stack spacing={2.5}>
            {showSchoolContext ? (
                <>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: 'rgba(248,250,252,0.9)',
                            border: '1px solid rgba(226,232,240,0.9)',
                        }}
                    >
                        <InfoRow label="Trường" value={schoolName} />
                        <InfoRow label="Chiến dịch" value={campaignName} />
                        <InfoRow label="Chương trình" value={programName} />
                    </Box>
                    <Divider sx={{borderColor: 'rgba(148,163,184,0.25)'}} />
                </>
            ) : null}

            {showParentInfo ? (
                <>
                    <Box>
                        <Typography sx={SECTION_LABEL_SX}>Phụ huynh</Typography>
                        <Stack spacing={0.5}>
                            <InfoRow label="Họ và tên" value={parentInfo?.name} />
                            <InfoRow label="Số điện thoại" value={parentInfo?.phone} />
                            {parentInfo?.email ? <InfoRow label="Email" value={parentInfo.email} /> : null}
                        </Stack>
                    </Box>
                    <Divider sx={{borderColor: 'rgba(148,163,184,0.25)'}} />
                </>
            ) : null}

            <Box>
                <Typography sx={SECTION_LABEL_SX}>{studentTitle}</Typography>
                <StudentProfilePicker
                    students={students}
                    loading={studentLoading}
                    error={studentError}
                    selectedStudentId={selectedStudentId}
                    onSelect={onSelectStudent}
                    disabled={studentPickerDisabled ?? disabled}
                />
            </Box>

            {studentDetailContent ?? null}

            <Divider sx={{borderColor: 'rgba(148,163,184,0.25)'}} />

            <Box>
                <Typography sx={SECTION_LABEL_SX}>{documentsSectionTitle}</Typography>
                {documentsHint ? (
                    <Typography sx={{fontSize: '0.88rem', color: '#64748b', mb: 1.5, lineHeight: 1.55}}>
                        {documentsHint}
                    </Typography>
                ) : null}
                <AdmissionDocumentsSection
                    docs={docs}
                    docsLoading={docsLoading}
                    docsError={docsError}
                    cloudinaryReady={cloudinaryReady}
                    uploadingSlots={uploadingSlots}
                    disabled={disabled}
                    onPickFile={onPickFile}
                    onRemoveSlot={onRemoveSlot}
                    emptyMessage="Không có hồ sơ nào cần nộp."
                />
            </Box>
        </Stack>
    );
}
