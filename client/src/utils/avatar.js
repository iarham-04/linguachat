export const ANIMAL_AVATARS = [
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🐯', label: 'Tiger' },
  { emoji: '🐻', label: 'Bear' },
  { emoji: '🐼', label: 'Panda' },
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🐨', label: 'Koala' },
  { emoji: '🐸', label: 'Frog' },
  { emoji: '🐰', label: 'Rabbit' },
  { emoji: '🐱', label: 'Cat' },
  { emoji: '🐶', label: 'Dog' }
];

export function parseNameAndAvatar(fullName) {
  if (!fullName) return { name: '', avatar: '' };

  // Check if the string starts with any emoji or special character surrogate pair
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  const match = fullName.match(emojiRegex);

  if (match && fullName.startsWith(match[0])) {
    const avatar = match[0];
    const name = fullName.substring(avatar.length).trim();
    return { name, avatar };
  }

  return { name: fullName, avatar: fullName.charAt(0).toUpperCase() };
}
