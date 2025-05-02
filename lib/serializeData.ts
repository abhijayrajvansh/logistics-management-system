// helper function to serialize firestore data
export function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (data.toDate instanceof Function) {
    // Convert Firestore Timestamp to ISO string
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item));
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      result[key] = serializeData(data[key]);
    });
    return result;
  }

  return data;
}