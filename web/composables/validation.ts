export const useValidate = (data: any) => {
  const validate = (keys: string[]) => {
    for (let i = 0; i < keys.length; i++) {
      if (!data[keys[i]]) {
        useAlert(`${keys[i]} is required`, true);
        return false;
      }
    }

    return true;
  };

  return { validate };
};