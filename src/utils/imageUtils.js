export const loadImageMetadata = async (src) => {
  try {
    const response = await fetch(`/assets/images/metadata/${src.replace(/\.[^/.]+$/, "")}.json`);
    if (!response.ok) throw new Error('Failed to load image metadata');
    return await response.json();
  } catch (error) {
    console.error('Error loading image metadata:', error);
    throw error;
  }
};
