import Papa from "papaparse";

const WQX_BASE_URL = "https://www.waterqualitydata.us/data/Result/search";
const REQUEST_TIMEOUT_MS = 30_000;

export type WaterQualityResult = {
  activityId: string;
  activityType: string;
  activityMediaName: string;
  activityStartDate: string;
  characteristicName: string;
  resultValue: string;
  resultUnit: string;
  resultStatusId: string;
  resultComment: string;
};

interface WqxResultRow {
  ActivityIdentifier: string;
  ActivityTypeCode: string;
  ActivityMediaName: string;
  "ActivityStartDate": string;
  CharacteristicName: string;
  "ResultMeasureValue": string;
  "ResultMeasure/MeasureUnitCode": string;
  ResultStatusIdentifier: string;
  ResultComment: string;
}

function parseResultRow(row: WqxResultRow): WaterQualityResult {
  return {
    activityId: row.ActivityIdentifier ?? "",
    activityType: row.ActivityTypeCode ?? "",
    activityMediaName: row.ActivityMediaName ?? "",
    activityStartDate: row["ActivityStartDate"] ?? "",
    characteristicName: row.CharacteristicName ?? "",
    resultValue: row["ResultMeasureValue"] ?? "",
    resultUnit: row["ResultMeasure/MeasureUnitCode"] ?? "",
    resultStatusId: row.ResultStatusIdentifier ?? "",
    resultComment: row.ResultComment ?? "",
  };
}

export type WqxFetchError = {
  type: "network" | "timeout" | "parse" | "no-data" | "http-error";
  message: string;
};

export type WqxResponse =
  | { ok: true; data: WaterQualityResult[] }
  | { ok: false; error: WqxFetchError };

/**
 * Fetch water quality results for a given station ID from the WQX API.
 * The API is public — no key needed.
 */
export async function fetchWaterQualityResults(
  stationId: string
): Promise<WqxResponse> {
  const url = `${WQX_BASE_URL}?siteid=${encodeURIComponent(stationId)}&mimeType=csv&zip=no`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          type: "http-error",
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      };
    }

    const csvText = await response.text();

    if (!csvText.trim()) {
      return {
        ok: false,
        error: { type: "no-data", message: "No data returned for this station" },
      };
    }

    const parsed = Papa.parse<WqxResultRow>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return {
        ok: false,
        error: {
          type: "parse",
          message: `CSV parse error: ${parsed.errors[0].message}`,
        },
      };
    }

    return { ok: true, data: parsed.data.map(parseResultRow) };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        ok: false,
        error: {
          type: "timeout",
          message: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
        },
      };
    }

    return {
      ok: false,
      error: {
        type: "network",
        message: err instanceof Error ? err.message : "Unknown network error",
      },
    };
  }
}

