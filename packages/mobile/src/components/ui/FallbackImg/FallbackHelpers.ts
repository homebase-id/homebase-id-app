import { Buffer } from 'buffer';

const anonymousFallbackImage =
  'PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik0xNzEuMzMzIDE3NFYxNjguNjY3QzE3MS4zMzMgMTY1LjgzOCAxNzAuMjEgMTYzLjEyNSAxNjguMjA5IDE2MS4xMjRDMTY2LjIwOSAxNTkuMTI0IDE2My40OTYgMTU4IDE2MC42NjcgMTU4SDEzOS4zMzNDMTM2LjUwNCAxNTggMTMzLjc5MSAxNTkuMTI0IDEzMS43OTEgMTYxLjEyNEMxMjkuNzkgMTYzLjEyNSAxMjguNjY3IDE2NS44MzggMTI4LjY2NyAxNjguNjY3VjE3NCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTE1MCAxNDcuMzMzQzE1NS44OTEgMTQ3LjMzMyAxNjAuNjY3IDE0Mi41NTggMTYwLjY2NyAxMzYuNjY3QzE2MC42NjcgMTMwLjc3NiAxNTUuODkxIDEyNiAxNTAgMTI2QzE0NC4xMDkgMTI2IDEzOS4zMzMgMTMwLjc3NiAxMzkuMzMzIDEzNi42NjdDMTM5LjMzMyAxNDIuNTU4IDE0NC4xMDkgMTQ3LjMzMyAxNTAgMTQ3LjMzM1oiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';

const profileImageCache = new Map<string, string>();

export const fallbackProfileImage = (initials?: string, backgroundColor?: string): string => {
  if (!initials || !initials.length) return anonymousFallbackImage;

  const cacheKey = `${initials}-${backgroundColor || '#F1F5F9'}`;
  if (profileImageCache.has(cacheKey)) {
    return profileImageCache.get(cacheKey)!;
  }

  const result = Buffer.from(
    `<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="${backgroundColor || '#F1F5F9'}"/><text x="150" y="150" alignment-baseline="middle" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="ui-sans-serif, system-ui, sans-serif" font-size="120" font-weight="300" letter-spacing="0em">${initials.toUpperCase()}</text></svg>`
  ).toString('base64');

  profileImageCache.set(cacheKey, result);
  return result;
};

