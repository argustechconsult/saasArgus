// In a real browser environment, we can't use native bcrypt binding.
// This is a simulation for the mock backend.
export const hashPassword = async (password: string): Promise<string> => {
  // Simulate async delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  // Simple base64 mock hash for demo purposes
  return `hashed_${btoa(password)}`;
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `hashed_${btoa(password)}` === hash;
};