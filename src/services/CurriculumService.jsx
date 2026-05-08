import axiosClient from "../configs/APIConfig.jsx";






export const getCurriculumList = async (page = 0, pageSize = 10) => {
    const response = await axiosClient.get("/school/curriculum/list", {
        params: { page, pageSize },
    });
    return response || null;
};















export const upsertCurriculum = async ({
    curriculumId = null,
    subTypeName,
    description,
    curriculumType,
    methodLearningList,
    subjectOptions,
}) => {
    const body = {
        subTypeName,
        description,
        curriculumType,
        methodLearningList: Array.isArray(methodLearningList) ? methodLearningList : [],
        subjectOptions: subjectOptions || [],
    };
    
    const numericId = curriculumId === null || curriculumId === undefined || curriculumId === "" ? null : Number(curriculumId);
    if (numericId !== null && !Number.isNaN(numericId) && numericId !== 0) {
        body.curriculumId = numericId;
    }
    const response = await axiosClient.post("/school/curriculum", body, {
        headers: {
            "X-Device-Type": "web",
        },
    });
    return response || null;
};


export const saveCurriculum = upsertCurriculum;








export const activateCurriculum = async (id, action) => {
    const response = await axiosClient.patch(`/school/${id}/activate/curriculum`, {}, {
        params: { action },
        headers: {
            "X-Device-Type": "web",
        },
    });
    return response || null;
};




export const getNationalCurriculumTemplate = async () => {
    const response = await axiosClient.get("/school/templates/national");
    return response || null;
};





export const extractInternationalCurriculumFromExcel = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosClient.post("/school/extract/excel/international", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response || null;
};
