import type {
  EvaluationKeywordItem,
  EvaluationKeywordPayload,
  InterviewQuestionItem,
  InterviewQuestionPayload,
  MasterDataItem,
  MasterDataPayload,
} from "../types/job";
import { API_BASE_URL, requestJson, requestVoid } from "./client";

type MasterDataResource = {
  path: string;
  payloadKey: string;
};

const positionsResource: MasterDataResource = { path: "positions", payloadKey: "position" };
const locationsResource: MasterDataResource = { path: "locations", payloadKey: "location" };
const techStacksResource: MasterDataResource = { path: "tech_stacks", payloadKey: "tech_stack" };
const positiveKeywordsResource: MasterDataResource = { path: "positive_keywords", payloadKey: "positive_keyword" };
const negativeKeywordsResource: MasterDataResource = { path: "negative_keywords", payloadKey: "negative_keyword" };
const interviewQuestionsResource: MasterDataResource = { path: "interview_questions", payloadKey: "interview_question" };

function masterDataUrl(resource: MasterDataResource, id?: number) {
  return `${API_BASE_URL}/api/${resource.path}${id ? `/${id}` : ""}`;
}

function fetchMasterData(resource: MasterDataResource, init?: RequestInit): Promise<MasterDataItem[]> {
  return requestJson<MasterDataItem[]>(masterDataUrl(resource), init);
}

function createMasterData(resource: MasterDataResource, payload: MasterDataPayload): Promise<MasterDataItem> {
  return requestJson<MasterDataItem>(masterDataUrl(resource), {
    method: "POST",
    body: JSON.stringify({ [resource.payloadKey]: payload }),
  });
}

function updateMasterData(
  resource: MasterDataResource,
  id: number,
  payload: MasterDataPayload,
): Promise<MasterDataItem> {
  return requestJson<MasterDataItem>(masterDataUrl(resource, id), {
    method: "PATCH",
    body: JSON.stringify({ [resource.payloadKey]: payload }),
  });
}

function deleteMasterData(resource: MasterDataResource, id: number): Promise<void> {
  return requestVoid(masterDataUrl(resource, id), { method: "DELETE" });
}

function fetchEvaluationKeywords(resource: MasterDataResource, init?: RequestInit): Promise<EvaluationKeywordItem[]> {
  return requestJson<EvaluationKeywordItem[]>(masterDataUrl(resource), init);
}

function createEvaluationKeyword(
  resource: MasterDataResource,
  payload: EvaluationKeywordPayload,
): Promise<EvaluationKeywordItem> {
  return requestJson<EvaluationKeywordItem>(masterDataUrl(resource), {
    method: "POST",
    body: JSON.stringify({ [resource.payloadKey]: payload }),
  });
}

function updateEvaluationKeyword(
  resource: MasterDataResource,
  id: number,
  payload: Partial<EvaluationKeywordPayload>,
): Promise<EvaluationKeywordItem> {
  return requestJson<EvaluationKeywordItem>(masterDataUrl(resource, id), {
    method: "PATCH",
    body: JSON.stringify({ [resource.payloadKey]: payload }),
  });
}

function deleteEvaluationKeyword(resource: MasterDataResource, id: number): Promise<void> {
  return requestVoid(masterDataUrl(resource, id), { method: "DELETE" });
}

export async function fetchPositions(init?: RequestInit): Promise<MasterDataItem[]> {
  return fetchMasterData(positionsResource, init);
}

export async function fetchLocations(init?: RequestInit): Promise<MasterDataItem[]> {
  return fetchMasterData(locationsResource, init);
}

export async function createPosition(position: MasterDataPayload): Promise<MasterDataItem> {
  return createMasterData(positionsResource, position);
}

export async function createLocation(location: MasterDataPayload): Promise<MasterDataItem> {
  return createMasterData(locationsResource, location);
}

export async function updatePosition(id: number, position: MasterDataPayload): Promise<MasterDataItem> {
  return updateMasterData(positionsResource, id, position);
}

export async function updateLocation(id: number, location: MasterDataPayload): Promise<MasterDataItem> {
  return updateMasterData(locationsResource, id, location);
}

export async function deletePosition(id: number): Promise<void> {
  return deleteMasterData(positionsResource, id);
}

export async function deleteLocation(id: number): Promise<void> {
  return deleteMasterData(locationsResource, id);
}

export async function fetchTechStacks(init?: RequestInit): Promise<MasterDataItem[]> {
  return fetchMasterData(techStacksResource, init);
}

export async function createTechStack(techStack: MasterDataPayload): Promise<MasterDataItem> {
  return createMasterData(techStacksResource, techStack);
}

export async function updateTechStack(id: number, techStack: MasterDataPayload): Promise<MasterDataItem> {
  return updateMasterData(techStacksResource, id, techStack);
}

export async function deleteTechStack(id: number): Promise<void> {
  return deleteMasterData(techStacksResource, id);
}

export async function fetchPositiveKeywords(init?: RequestInit): Promise<EvaluationKeywordItem[]> {
  return fetchEvaluationKeywords(positiveKeywordsResource, init);
}

export async function createPositiveKeyword(payload: EvaluationKeywordPayload): Promise<EvaluationKeywordItem> {
  return createEvaluationKeyword(positiveKeywordsResource, payload);
}

export async function updatePositiveKeyword(
  id: number,
  payload: EvaluationKeywordPayload,
): Promise<EvaluationKeywordItem> {
  return updateEvaluationKeyword(positiveKeywordsResource, id, payload);
}

export async function deletePositiveKeyword(id: number): Promise<void> {
  return deleteEvaluationKeyword(positiveKeywordsResource, id);
}

export async function fetchNegativeKeywords(init?: RequestInit): Promise<EvaluationKeywordItem[]> {
  return fetchEvaluationKeywords(negativeKeywordsResource, init);
}

export async function createNegativeKeyword(payload: EvaluationKeywordPayload): Promise<EvaluationKeywordItem> {
  return createEvaluationKeyword(negativeKeywordsResource, payload);
}

export async function updateNegativeKeyword(
  id: number,
  payload: EvaluationKeywordPayload,
): Promise<EvaluationKeywordItem> {
  return updateEvaluationKeyword(negativeKeywordsResource, id, payload);
}

export async function deleteNegativeKeyword(id: number): Promise<void> {
  return deleteEvaluationKeyword(negativeKeywordsResource, id);
}

export async function fetchInterviewQuestions(init?: RequestInit): Promise<InterviewQuestionItem[]> {
  return requestJson<InterviewQuestionItem[]>(masterDataUrl(interviewQuestionsResource), init);
}

export async function createInterviewQuestion(payload: InterviewQuestionPayload): Promise<InterviewQuestionItem> {
  return requestJson<InterviewQuestionItem>(masterDataUrl(interviewQuestionsResource), {
    method: "POST",
    body: JSON.stringify({ interview_question: payload }),
  });
}

export async function updateInterviewQuestion(
  id: number,
  payload: Partial<InterviewQuestionPayload>,
): Promise<InterviewQuestionItem> {
  return requestJson<InterviewQuestionItem>(masterDataUrl(interviewQuestionsResource, id), {
    method: "PATCH",
    body: JSON.stringify({ interview_question: payload }),
  });
}

export async function deleteInterviewQuestion(id: number): Promise<void> {
  return requestVoid(masterDataUrl(interviewQuestionsResource, id), { method: "DELETE" });
}
