export function isImeComposing(
  nativeEvent: { isComposing?: boolean; keyCode?: number; which?: number },
  composingRefValue?: boolean
): boolean {
  return Boolean(
    composingRefValue ||
    nativeEvent?.isComposing ||
    nativeEvent?.keyCode === 229 ||
    nativeEvent?.which === 229
  );
}

