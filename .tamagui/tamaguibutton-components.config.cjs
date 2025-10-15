var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/@tamagui/button/dist/esm/index.mjs
var esm_exports = {};
__export(esm_exports, {
  Button: () => Button2,
  ButtonContext: () => ButtonContext,
  ButtonFrame: () => ButtonFrame,
  ButtonIcon: () => ButtonIcon,
  ButtonText: () => ButtonText,
  useButton: () => useButton
});
module.exports = __toCommonJS(esm_exports);

// node_modules/@tamagui/font-size/dist/esm/getFontSize.mjs
var import_core = require("@tamagui/core");
var getFontSize = /* @__PURE__ */ __name((inSize, opts) => {
  const res = getFontSizeVariable(inSize, opts);
  return (0, import_core.isVariable)(res) ? +res.val : res ? +res : 16;
}, "getFontSize");
var getFontSizeVariable = /* @__PURE__ */ __name((inSize, opts) => {
  const token = getFontSizeToken(inSize, opts);
  if (!token) return inSize;
  const conf = (0, import_core.getConfig)();
  return conf.fontsParsed[opts?.font || conf.defaultFontToken]?.size[token];
}, "getFontSizeVariable");
var getFontSizeToken = /* @__PURE__ */ __name((inSize, opts) => {
  if (typeof inSize == "number") return null;
  const relativeSize = opts?.relativeSize || 0, conf = (0, import_core.getConfig)(), fontSize = conf.fontsParsed[opts?.font || conf.defaultFontToken]?.size || // fallback to size tokens
  conf.tokensParsed.size, size = (inSize === "$true" && !("$true" in fontSize) ? "$4" : inSize) ?? ("$true" in fontSize ? "$true" : "$4"), sizeTokens = Object.keys(fontSize);
  let foundIndex = sizeTokens.indexOf(size);
  foundIndex === -1 && size.endsWith(".5") && (foundIndex = sizeTokens.indexOf(size.replace(".5", ""))), process.env.NODE_ENV === "development" && foundIndex === -1 && console.warn("No font size found", size, opts, "in size tokens", sizeTokens);
  const tokenIndex = Math.min(Math.max(0, foundIndex + relativeSize), sizeTokens.length - 1);
  return sizeTokens[tokenIndex] ?? size;
}, "getFontSizeToken");

// node_modules/@tamagui/get-token/dist/esm/index.mjs
var import_web = require("@tamagui/core");
var defaultOptions = {
  shift: 0,
  bounds: [0]
};
var getSpace = /* @__PURE__ */ __name((space, options) => getTokenRelative("space", space, options), "getSpace");
var cacheVariables = {};
var cacheWholeVariables = {};
var cacheKeys = {};
var cacheWholeKeys = {};
var stepTokenUpOrDown = /* @__PURE__ */ __name((type, current, options = defaultOptions) => {
  const tokens = (0, import_web.getTokens)({
    prefixed: true
  })[type];
  if (!(type in cacheVariables)) {
    cacheKeys[type] = [], cacheVariables[type] = [], cacheWholeKeys[type] = [], cacheWholeVariables[type] = [];
    const sorted = Object.keys(tokens).map((k) => tokens[k]).sort((a, b) => a.val - b.val);
    for (const token of sorted) cacheKeys[type].push(token.key), cacheVariables[type].push(token);
    const sortedExcludingHalfSteps = sorted.filter((x) => !x.key.endsWith(".5"));
    for (const token of sortedExcludingHalfSteps) cacheWholeKeys[type].push(token.key), cacheWholeVariables[type].push(token);
  }
  const isString = typeof current == "string", tokensOrdered = (options.excludeHalfSteps ? isString ? cacheWholeKeys : cacheWholeVariables : isString ? cacheKeys : cacheVariables)[type], min = options.bounds?.[0] ?? 0, max = options.bounds?.[1] ?? tokensOrdered.length - 1, currentIndex = tokensOrdered.indexOf(current);
  let shift = options.shift || 0;
  shift && (current === "$true" || (0, import_web.isVariable)(current) && current.name === "true") && (shift += shift > 0 ? 1 : -1);
  const index = Math.min(max, Math.max(min, currentIndex + shift)), found = tokensOrdered[index];
  return (typeof found == "string" ? tokens[found] : found) || tokens.$true;
}, "stepTokenUpOrDown");
var getTokenRelative = stepTokenUpOrDown;

// node_modules/@tamagui/get-button-sized/dist/esm/index.mjs
var getButtonSized = /* @__PURE__ */ __name((val, {
  tokens,
  props
}) => {
  if (!val || props.circular) return;
  if (typeof val == "number") return {
    paddingHorizontal: val * 0.25,
    height: val,
    borderRadius: props.circular ? 1e5 : val * 0.2
  };
  const xSize = getSpace(val), radiusToken = tokens.radius[val] ?? tokens.radius.$true;
  return {
    paddingHorizontal: xSize,
    height: val,
    borderRadius: props.circular ? 1e5 : radiusToken
  };
}, "getButtonSized");

// node_modules/@tamagui/constants/dist/esm/constants.mjs
var import_react = require("react");
var import_react2 = require("react");
var isWeb = true;
var isWindowDefined = typeof window < "u";
var isClient = isWeb && isWindowDefined;
var isChrome = typeof navigator < "u" && /Chrome/.test(navigator.userAgent || "");
var isWebTouchable = isClient && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
var isAndroid = false;
var isIos = process.env.TEST_NATIVE_PLATFORM === "ios";

// node_modules/@tamagui/helpers/dist/esm/validStyleProps.mjs
var textColors = {
  color: true,
  textDecorationColor: true,
  textShadowColor: true
};
var tokenCategories = {
  radius: {
    borderRadius: true,
    borderTopLeftRadius: true,
    borderTopRightRadius: true,
    borderBottomLeftRadius: true,
    borderBottomRightRadius: true,
    // logical
    borderStartStartRadius: true,
    borderStartEndRadius: true,
    borderEndStartRadius: true,
    borderEndEndRadius: true
  },
  size: {
    width: true,
    height: true,
    minWidth: true,
    minHeight: true,
    maxWidth: true,
    maxHeight: true,
    blockSize: true,
    minBlockSize: true,
    maxBlockSize: true,
    inlineSize: true,
    minInlineSize: true,
    maxInlineSize: true
  },
  zIndex: {
    zIndex: true
  },
  color: {
    backgroundColor: true,
    borderColor: true,
    borderBlockStartColor: true,
    borderBlockEndColor: true,
    borderBlockColor: true,
    borderBottomColor: true,
    borderInlineColor: true,
    borderInlineStartColor: true,
    borderInlineEndColor: true,
    borderTopColor: true,
    borderLeftColor: true,
    borderRightColor: true,
    borderEndColor: true,
    borderStartColor: true,
    shadowColor: true,
    ...textColors,
    outlineColor: true,
    caretColor: true
  }
};
var stylePropsUnitless = {
  WebkitLineClamp: true,
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexOrder: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  fontWeight: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowGap: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnGap: true,
  gridColumnStart: true,
  gridTemplateColumns: true,
  gridTemplateAreas: true,
  lineClamp: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  scale: true,
  scaleX: true,
  scaleY: true,
  scaleZ: true,
  shadowOpacity: true
};
var stylePropsTransform = {
  x: true,
  y: true,
  scale: true,
  perspective: true,
  scaleX: true,
  scaleY: true,
  skewX: true,
  skewY: true,
  matrix: true,
  rotate: true,
  rotateY: true,
  rotateX: true,
  rotateZ: true
};
var stylePropsView = {
  backfaceVisibility: true,
  borderBottomEndRadius: true,
  borderBottomStartRadius: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderBlockWidth: true,
  borderBlockEndWidth: true,
  borderBlockStartWidth: true,
  borderInlineWidth: true,
  borderInlineEndWidth: true,
  borderInlineStartWidth: true,
  borderStyle: true,
  borderBlockStyle: true,
  borderBlockEndStyle: true,
  borderBlockStartStyle: true,
  borderInlineStyle: true,
  borderInlineEndStyle: true,
  borderInlineStartStyle: true,
  borderTopEndRadius: true,
  borderTopStartRadius: true,
  borderTopWidth: true,
  borderWidth: true,
  transform: true,
  transformOrigin: true,
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  borderEndWidth: true,
  borderStartWidth: true,
  bottom: true,
  display: true,
  end: true,
  flexBasis: true,
  flexDirection: true,
  flexWrap: true,
  gap: true,
  columnGap: true,
  rowGap: true,
  justifyContent: true,
  left: true,
  margin: true,
  marginBlock: true,
  marginBlockEnd: true,
  marginBlockStart: true,
  marginInline: true,
  marginInlineStart: true,
  marginInlineEnd: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,
  overflow: true,
  padding: true,
  paddingBottom: true,
  paddingInline: true,
  paddingBlock: true,
  paddingBlockStart: true,
  paddingInlineEnd: true,
  paddingInlineStart: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,
  position: true,
  right: true,
  start: true,
  top: true,
  inset: true,
  insetBlock: true,
  insetBlockEnd: true,
  insetBlockStart: true,
  insetInline: true,
  insetInlineEnd: true,
  insetInlineStart: true,
  direction: true,
  shadowOffset: true,
  shadowRadius: true,
  ...tokenCategories.color,
  ...tokenCategories.radius,
  ...tokenCategories.size,
  ...tokenCategories.radius,
  ...stylePropsTransform,
  ...stylePropsUnitless,
  boxShadow: true,
  filter: true,
  // RN doesn't support specific border styles per-edge
  transition: true,
  textWrap: true,
  backdropFilter: true,
  WebkitBackdropFilter: true,
  background: true,
  backgroundAttachment: true,
  backgroundBlendMode: true,
  backgroundClip: true,
  backgroundColor: true,
  backgroundImage: true,
  backgroundOrigin: true,
  backgroundPosition: true,
  backgroundRepeat: true,
  backgroundSize: true,
  borderBottomStyle: true,
  borderImage: true,
  borderLeftStyle: true,
  borderRightStyle: true,
  borderTopStyle: true,
  boxSizing: true,
  caretColor: true,
  clipPath: true,
  contain: true,
  containerType: true,
  content: true,
  cursor: true,
  float: true,
  mask: true,
  maskBorder: true,
  maskBorderMode: true,
  maskBorderOutset: true,
  maskBorderRepeat: true,
  maskBorderSlice: true,
  maskBorderSource: true,
  maskBorderWidth: true,
  maskClip: true,
  maskComposite: true,
  maskImage: true,
  maskMode: true,
  maskOrigin: true,
  maskPosition: true,
  maskRepeat: true,
  maskSize: true,
  maskType: true,
  mixBlendMode: true,
  objectFit: true,
  objectPosition: true,
  outlineOffset: true,
  outlineStyle: true,
  outlineWidth: true,
  overflowBlock: true,
  overflowInline: true,
  overflowX: true,
  overflowY: true,
  pointerEvents: true,
  scrollbarWidth: true,
  textEmphasis: true,
  touchAction: true,
  transformStyle: true,
  userSelect: true,
  ...isAndroid ? {
    elevationAndroid: true
  } : {}
};
var stylePropsFont = {
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontWeight: true,
  fontVariant: true,
  letterSpacing: true,
  lineHeight: true,
  textTransform: true
};
var stylePropsTextOnly = {
  ...stylePropsFont,
  textAlign: true,
  textDecorationLine: true,
  textDecorationStyle: true,
  ...textColors,
  textShadowOffset: true,
  textShadowRadius: true,
  userSelect: true,
  selectable: true,
  verticalAlign: true,
  whiteSpace: true,
  wordWrap: true,
  textOverflow: true,
  textDecorationDistance: true,
  cursor: true,
  WebkitLineClamp: true,
  WebkitBoxOrient: true
};
var stylePropsText = {
  ...stylePropsView,
  ...stylePropsTextOnly
};

// node_modules/@tamagui/helpers/dist/esm/withStaticProperties.mjs
var import_react3 = __toESM(require("react"), 1);
var Decorated = Symbol();
var withStaticProperties = /* @__PURE__ */ __name((component, staticProps) => {
  const next = (() => {
    if (component[Decorated]) {
      const _ = import_react3.default.forwardRef((props, ref) => import_react3.default.createElement(component, {
        ...props,
        ref
      }));
      for (const key in component) {
        const v = component[key];
        _[key] = v && typeof v == "object" ? {
          ...v
        } : v;
      }
    }
    return component;
  })();
  return Object.assign(next, staticProps), next[Decorated] = true, next;
}, "withStaticProperties");

// node_modules/@tamagui/helpers-tamagui/dist/esm/useCurrentColor.mjs
var import_web2 = require("@tamagui/core");
var useCurrentColor = /* @__PURE__ */ __name((colorProp) => {
  const theme = (0, import_web2.useTheme)();
  return colorProp ? (0, import_web2.getVariable)(colorProp) : theme[colorProp]?.get() || theme.color?.get();
}, "useCurrentColor");

// node_modules/@tamagui/helpers-tamagui/dist/esm/useGetThemedIcon.mjs
var import_react4 = __toESM(require("react"), 1);
var useGetThemedIcon = /* @__PURE__ */ __name((props) => {
  const color = useCurrentColor(props.color);
  return (el) => el && (import_react4.default.isValidElement(el) ? import_react4.default.cloneElement(el, {
    ...props,
    color,
    // @ts-expect-error
    ...el.props
  }) : import_react4.default.createElement(el, props));
}, "useGetThemedIcon");

// node_modules/@tamagui/stacks/dist/esm/Stacks.mjs
var import_core3 = require("@tamagui/core");

// node_modules/@tamagui/stacks/dist/esm/getElevation.mjs
var import_core2 = require("@tamagui/core");
var getElevation = /* @__PURE__ */ __name((size, extras) => {
  if (!size) return;
  const {
    tokens
  } = extras, token = tokens.size[size], sizeNum = (0, import_core2.isVariable)(token) ? +token.val : size;
  return getSizedElevation(sizeNum, extras);
}, "getElevation");
var getSizedElevation = /* @__PURE__ */ __name((val, {
  theme,
  tokens
}) => {
  let num = 0;
  if (val === true) {
    const val2 = (0, import_core2.getVariableValue)(tokens.size.true);
    typeof val2 == "number" ? num = val2 : num = 10;
  } else num = +val;
  if (num === 0) return;
  const [height, shadowRadius] = [Math.round(num / 4 + 1), Math.round(num / 2 + 2)];
  return {
    shadowColor: theme.shadowColor,
    shadowRadius,
    shadowOffset: {
      height,
      width: 0
    },
    ...import_core2.isAndroid ? {
      elevationAndroid: 2 * height
    } : {}
  };
}, "getSizedElevation");

// node_modules/@tamagui/stacks/dist/esm/Stacks.mjs
var fullscreenStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
};
var getInset = /* @__PURE__ */ __name((val) => val && typeof val == "object" ? val : {
  top: val,
  left: val,
  bottom: val,
  right: val
}, "getInset");
var variants = {
  fullscreen: {
    true: fullscreenStyle
  },
  elevation: {
    "...size": getElevation,
    ":number": getElevation
  },
  inset: getInset
};
var YStack = (0, import_core3.styled)(import_core3.View, {
  flexDirection: "column",
  variants
});
YStack.displayName = "YStack";
var XStack = (0, import_core3.styled)(import_core3.View, {
  flexDirection: "row",
  variants
});
XStack.displayName = "XStack";
var ZStack = (0, import_core3.styled)(YStack, {
  position: "relative"
}, {
  neverFlatten: true,
  isZStack: true
});
ZStack.displayName = "ZStack";

// node_modules/@tamagui/stacks/dist/esm/variants.mjs
var elevate = {
  true: /* @__PURE__ */ __name((_, extras) => getElevation(extras.props.size, extras), "true")
};
var bordered = /* @__PURE__ */ __name((val, {
  props
}) => ({
  // TODO size it with size in '...size'
  borderWidth: typeof val == "number" ? val : 1,
  borderColor: "$borderColor",
  ...props.hoverTheme && {
    hoverStyle: {
      borderColor: "$borderColorHover"
    }
  },
  ...props.pressTheme && {
    pressStyle: {
      borderColor: "$borderColorPress"
    }
  },
  ...props.focusTheme && {
    focusStyle: {
      borderColor: "$borderColorFocus"
    }
  }
}), "bordered");
var padded = {
  true: /* @__PURE__ */ __name((_, extras) => {
    const {
      tokens,
      props
    } = extras;
    return {
      padding: tokens.space[props.size] || tokens.space.$true
    };
  }, "true")
};
var radiused = {
  true: /* @__PURE__ */ __name((_, extras) => {
    const {
      tokens,
      props
    } = extras;
    return {
      borderRadius: tokens.radius[props.size] || tokens.radius.$true
    };
  }, "true")
};
var circularStyle = {
  borderRadius: 1e5,
  padding: 0
};
var circular = {
  true: /* @__PURE__ */ __name((_, {
    props,
    tokens
  }) => {
    if (!("size" in props)) return circularStyle;
    const size = typeof props.size == "number" ? props.size : tokens.size[props.size];
    return {
      ...circularStyle,
      width: size,
      height: size,
      maxWidth: size,
      maxHeight: size,
      minWidth: size,
      minHeight: size
    };
  }, "true")
};
var hoverTheme = {
  true: {
    hoverStyle: {
      backgroundColor: "$backgroundHover",
      borderColor: "$borderColorHover"
    }
  },
  false: {}
};
var pressTheme = {
  true: {
    cursor: "pointer",
    pressStyle: {
      backgroundColor: "$backgroundPress",
      borderColor: "$borderColorPress"
    }
  },
  false: {}
};
var focusTheme = {
  true: {
    focusStyle: {
      backgroundColor: "$backgroundFocus",
      borderColor: "$borderColorFocus"
    }
  },
  false: {}
};

// node_modules/@tamagui/stacks/dist/esm/ThemeableStack.mjs
var import_core4 = require("@tamagui/core");
var chromelessStyle = {
  backgroundColor: "transparent",
  borderColor: "transparent",
  shadowColor: "transparent",
  hoverStyle: {
    borderColor: "transparent"
  }
};
var themeableVariants = {
  backgrounded: {
    true: {
      backgroundColor: "$background"
    }
  },
  radiused,
  hoverTheme,
  pressTheme,
  focusTheme,
  circular,
  padded,
  elevate,
  bordered,
  transparent: {
    true: {
      backgroundColor: "transparent"
    }
  },
  chromeless: {
    true: chromelessStyle,
    all: {
      ...chromelessStyle,
      hoverStyle: chromelessStyle,
      pressStyle: chromelessStyle,
      focusStyle: chromelessStyle
    }
  }
};
var ThemeableStack = (0, import_core4.styled)(YStack, {
  variants: themeableVariants
});

// node_modules/@tamagui/stacks/dist/esm/NestingContext.mjs
var import_react5 = __toESM(require("react"), 1);
var ButtonNestingContext = import_react5.default.createContext(false);

// node_modules/@tamagui/get-font-sized/dist/esm/index.mjs
var import_web3 = require("@tamagui/core");
var getFontSized = /* @__PURE__ */ __name((sizeTokenIn = "$true", {
  font,
  fontFamily,
  props
}) => {
  if (!font) return {
    fontSize: sizeTokenIn
  };
  const sizeToken = sizeTokenIn === "$true" ? getDefaultSizeToken(font) : sizeTokenIn, style = {}, fontSize = font.size[sizeToken], lineHeight = font.lineHeight?.[sizeToken], fontWeight = font.weight?.[sizeToken], letterSpacing = font.letterSpacing?.[sizeToken], textTransform = font.transform?.[sizeToken], fontStyle = props.fontStyle ?? font.style?.[sizeToken], color = props.color ?? font.color?.[sizeToken];
  return fontStyle && (style.fontStyle = fontStyle), textTransform && (style.textTransform = textTransform), fontFamily && (style.fontFamily = fontFamily), fontWeight && (style.fontWeight = fontWeight), letterSpacing && (style.letterSpacing = letterSpacing), fontSize && (style.fontSize = fontSize), lineHeight && (style.lineHeight = lineHeight), color && (style.color = color), process.env.NODE_ENV === "development" && props.debug && props.debug === "verbose" && (console.groupCollapsed("  \u{1F539} getFontSized", sizeTokenIn, sizeToken), isClient && console.info({
    style,
    props,
    font
  }), console.groupEnd()), style;
}, "getFontSized");
var SizableText = (0, import_web3.styled)(import_web3.Text, {
  name: "SizableText",
  fontFamily: "$body",
  variants: {
    size: {
      "...fontSize": getFontSized
    }
  },
  defaultVariants: {
    size: "$true"
  }
});
var cache = /* @__PURE__ */ new WeakMap();
function getDefaultSizeToken(font) {
  if (typeof font == "object" && cache.has(font)) return cache.get(font);
  const sizeTokens = "$true" in font.size ? font.size : (0, import_web3.getTokens)().size, sizeDefault = sizeTokens.$true, sizeDefaultSpecific = sizeDefault ? Object.keys(sizeTokens).find((x) => x !== "$true" && sizeTokens[x].val === sizeDefault.val) : null;
  return !sizeDefault || !sizeDefaultSpecific ? (process.env.NODE_ENV === "development" && console.warn(`No default size is set in your tokens for the "true" key, fonts will be inconsistent.

      Fix this by having consistent tokens across fonts and sizes and setting a true key for your size tokens, or
      set true keys for all your font tokens: "size", "lineHeight", "fontStyle", etc.`), Object.keys(font.size)[3]) : (cache.set(font, sizeDefaultSpecific), sizeDefaultSpecific);
}
__name(getDefaultSizeToken, "getDefaultSizeToken");

// node_modules/@tamagui/text/dist/esm/SizableText.mjs
var import_web4 = require("@tamagui/core");
var SizableText2 = (0, import_web4.styled)(import_web4.Text, {
  name: "SizableText",
  fontFamily: "$body",
  variants: {
    unstyled: {
      false: {
        size: "$true",
        color: "$color"
      }
    },
    size: getFontSized
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
SizableText2.staticConfig.variants.fontFamily = {
  "...": /* @__PURE__ */ __name((_val, extras) => {
    const sizeProp = extras.props.size, fontSizeProp = extras.props.fontSize, size = sizeProp === "$true" && fontSizeProp ? fontSizeProp : extras.props.size || "$true";
    return getFontSized(size, extras);
  }, "...")
};

// node_modules/@tamagui/text/dist/esm/wrapChildrenInText.mjs
var import_react6 = __toESM(require("react"), 1);
var import_jsx_runtime = require("react/jsx-runtime");
function wrapChildrenInText(TextComponent, propsIn, extraProps) {
  const {
    children,
    textProps,
    size,
    noTextWrap,
    color,
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    textAlign,
    fontStyle,
    maxFontSizeMultiplier
  } = propsIn;
  if (noTextWrap || !children) return [children];
  const props = {
    ...extraProps
  };
  return color && (props.color = color), fontFamily && (props.fontFamily = fontFamily), fontSize && (props.fontSize = fontSize), fontWeight && (props.fontWeight = fontWeight), letterSpacing && (props.letterSpacing = letterSpacing), textAlign && (props.textAlign = textAlign), size && (props.size = size), fontStyle && (props.fontStyle = fontStyle), maxFontSizeMultiplier && (props.maxFontSizeMultiplier = maxFontSizeMultiplier), import_react6.default.Children.toArray(children).map((child, index) => typeof child == "string" ? (
    // so "data-disable-theme" is a hack to fix themeInverse, don't ask me why
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextComponent, {
      ...props,
      ...textProps,
      children: child
    }, index)
  ) : child);
}
__name(wrapChildrenInText, "wrapChildrenInText");

// node_modules/@tamagui/button/dist/esm/Button.mjs
var import_web5 = require("@tamagui/core");
var import_react7 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var ButtonContext = (0, import_web5.createStyledContext)({
  // keeping these here means they work with styled() passing down color to text
  color: void 0,
  ellipse: void 0,
  fontFamily: void 0,
  fontSize: void 0,
  fontStyle: void 0,
  fontWeight: void 0,
  letterSpacing: void 0,
  maxFontSizeMultiplier: void 0,
  size: void 0,
  textAlign: void 0,
  variant: void 0
});
var BUTTON_NAME = "Button";
var ButtonFrame = (0, import_web5.styled)(ThemeableStack, {
  name: BUTTON_NAME,
  tag: "button",
  context: ButtonContext,
  role: "button",
  focusable: true,
  variants: {
    unstyled: {
      false: {
        size: "$true",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "nowrap",
        flexDirection: "row",
        cursor: "pointer",
        hoverTheme: true,
        pressTheme: true,
        backgrounded: true,
        borderWidth: 1,
        borderColor: "transparent",
        focusVisibleStyle: {
          outlineColor: "$outlineColor",
          outlineStyle: "solid",
          outlineWidth: 2
        }
      }
    },
    variant: {
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: "$borderColor",
        hoverStyle: {
          backgroundColor: "transparent",
          borderColor: "$borderColorHover"
        },
        pressStyle: {
          backgroundColor: "transparent",
          borderColor: "$borderColorPress"
        },
        focusVisibleStyle: {
          backgroundColor: "transparent",
          borderColor: "$borderColorFocus"
        }
      }
    },
    size: {
      "...size": getButtonSized,
      ":number": getButtonSized
    },
    disabled: {
      true: {
        pointerEvents: "none"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
var ButtonText = (0, import_web5.styled)(SizableText2, {
  name: "Button",
  context: ButtonContext,
  variants: {
    unstyled: {
      false: {
        userSelect: "none",
        cursor: "pointer",
        // flexGrow 1 leads to inconsistent native style where text pushes to start of view
        flexGrow: 0,
        flexShrink: 1,
        ellipse: true,
        color: "$color"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
var ButtonIcon = /* @__PURE__ */ __name((props) => {
  const {
    children,
    scaleIcon = 1
  } = props, {
    size,
    color
  } = (0, import_react7.useContext)(ButtonContext), iconSize = (typeof size == "number" ? size * 0.5 : getFontSize(size)) * scaleIcon;
  return useGetThemedIcon({
    size: iconSize,
    color
  })(children);
}, "ButtonIcon");
var ButtonComponent = ButtonFrame.styleable(function(props, ref) {
  const {
    props: buttonProps
  } = useButton(props);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ButtonFrame, {
    "data-disable-theme": true,
    ...buttonProps,
    ref
  });
});
var Button2 = withStaticProperties(ButtonComponent, {
  Text: ButtonText,
  Icon: ButtonIcon
});
function useButton({
  textProps,
  ...propsIn
}, {
  Text: Text3 = Button2.Text
} = {
  Text: Button2.Text
}) {
  const isNested = (0, import_react7.useContext)(ButtonNestingContext), propsActive = (0, import_web5.useProps)(propsIn, {
    noNormalize: true,
    noExpand: true
  }), {
    icon,
    iconAfter,
    space,
    spaceFlex,
    scaleIcon = 1,
    scaleSpace = 0.66,
    separator,
    noTextWrap,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    letterSpacing,
    tag,
    ellipse,
    maxFontSizeMultiplier,
    ...restProps
  } = propsActive, size = propsActive.size || (propsActive.unstyled ? void 0 : "$true"), color = propsActive.color, iconSize = (typeof size == "number" ? size * 0.5 : getFontSize(size, {
    font: fontFamily?.[0] === "$" ? fontFamily : void 0
  })) * scaleIcon, getThemedIcon = useGetThemedIcon({
    size: iconSize,
    color
  }), [themedIcon, themedIconAfter] = [icon, iconAfter].map(getThemedIcon), spaceSize = space ?? (0, import_web5.getVariableValue)(iconSize) * scaleSpace, contents = noTextWrap ? [propsIn.children] : wrapChildrenInText(Text3, {
    children: propsIn.children,
    color,
    fontFamily,
    fontSize,
    textProps,
    fontWeight,
    fontStyle,
    letterSpacing,
    ellipse,
    maxFontSizeMultiplier
  }, Text3 === ButtonText && propsActive.unstyled !== true ? {
    unstyled: process.env.TAMAGUI_HEADLESS === "1",
    size
  } : void 0), inner = (0, import_web5.spacedChildren)({
    // a bit arbitrary but scaling to font size is necessary so long as button does
    space: spaceSize === false ? 0 : spaceSize == true ? "$true" : spaceSize,
    spaceFlex,
    ensureKeys: true,
    separator,
    direction: propsActive.flexDirection === "column" || propsActive.flexDirection === "column-reverse" ? "vertical" : "horizontal",
    // for keys to stay the same we keep indices as similar a possible
    // so even if icons are undefined we still pass them
    children: [themedIcon, ...contents, themedIconAfter]
  }), props = {
    size,
    ...propsIn.disabled && {
      // in rnw - false still has keyboard tabIndex, undefined = not actually focusable
      focusable: void 0,
      // even with tabIndex unset, it will keep focusVisibleStyle on web so disable it here
      focusVisibleStyle: {
        borderColor: "$background"
      }
    },
    // fixes SSR issue + DOM nesting issue of not allowing button in button
    tag: tag ?? (isNested ? "span" : (
      // defaults to <a /> when accessibilityRole = link
      // see https://github.com/tamagui/tamagui/issues/505
      propsActive.accessibilityRole === "link" || propsActive.role === "link" ? "a" : "button"
    )),
    ...restProps,
    children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ButtonNestingContext.Provider, {
      value: true,
      children: inner
    }),
    // forces it to be a runtime pressStyle so it passes through context text colors
    disableClassName: true
  };
  return {
    spaceSize,
    isNested,
    props
  };
}
__name(useButton, "useButton");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Button,
  ButtonContext,
  ButtonFrame,
  ButtonIcon,
  ButtonText,
  useButton
});
