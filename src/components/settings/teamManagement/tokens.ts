export const TOKENS = {
  colors: {
    primary: "#00B55B",
    primaryLight: "#D6FAE8",
    secondary: "#4D82F3",
    secondaryLight: "#D3E1FE",
    light: {
      0: "#FFFFFF",
      30: "#E2E2E2",
      40: "#D0D0D0",
      50: "#B0B0B0",
      60: "#808080",
      90: "#252525",
      100: "#000000",
    },
  },
  node: {
    leader: { w: 148, h: 44, avatar: 32 },
    member: { w: 148, h: 44, avatar: 32 },
    badge: { w: 66, h: 22 },
  },
  connector: {
    color: "#E2E2E2",
    width: 1,
    borderRadius: 9999,
  },
  spacing: {
    vertical: 20,
    horizontal: 16,
    badgeOffset: 26,
  },
} as const;
