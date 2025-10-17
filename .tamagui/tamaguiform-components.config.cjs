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

// node_modules/.pnpm/@tamagui+form@1.135.2_react_55b0eba07a9698dce5f99e5ef3127915/node_modules/@tamagui/form/dist/esm/index.mjs
var esm_exports = {};
__export(esm_exports, {
  Form: () => Form2,
  FormFrame: () => FormFrame,
  FormProvider: () => FormProvider,
  FormTrigger: () => FormTrigger,
  useFormContext: () => useFormContext
});
module.exports = __toCommonJS(esm_exports);

// node_modules/.pnpm/@tamagui+form@1.135.2_react_55b0eba07a9698dce5f99e5ef3127915/node_modules/@tamagui/form/dist/esm/Form.mjs
var import_core = require("@tamagui/core");

// node_modules/.pnpm/@tamagui+create-context@1.135.2_react@19.1.0/node_modules/@tamagui/create-context/dist/esm/create-context.mjs
var React = __toESM(require("react"), 1);
var import_jsx_runtime = require("react/jsx-runtime");
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext2(rootComponentName, defaultContext) {
    const BaseContext = React.createContext(defaultContext), index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    function Provider(props) {
      const {
        scope,
        children,
        ...context
      } = props, Context = scope?.[scopeName]?.[index] || BaseContext, value = React.useMemo(() => context, Object.values(context));
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Context.Provider, {
        value,
        children
      });
    }
    __name(Provider, "Provider");
    function useContext2(consumerName, scope, options) {
      const Context = scope?.[scopeName]?.[index] || BaseContext, context = React.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      const missingContextMessage = `\`${consumerName}\` must be used within \`${rootComponentName}\``;
      if (options?.fallback) return options?.warn !== false && console.warn(missingContextMessage), options.fallback;
      throw new Error(missingContextMessage);
    }
    __name(useContext2, "useContext");
    return [Provider, useContext2];
  }
  __name(createContext2, "createContext2");
  const createScope = /* @__PURE__ */ __name(() => {
    const scopeContexts = defaultContexts.map((defaultContext) => React.createContext(defaultContext));
    return function(scope) {
      const contexts = scope?.[scopeName] || scopeContexts;
      return React.useMemo(() => ({
        [`__scope${scopeName}`]: {
          ...scope,
          [scopeName]: contexts
        }
      }), [scope, contexts]);
    };
  }, "createScope");
  return createScope.scopeName = scopeName, [createContext2, composeContextScopes(createScope, ...createContextScopeDeps)];
}
__name(createContextScope, "createContextScope");
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = /* @__PURE__ */ __name(() => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, {
        useScope,
        scopeName
      }) => {
        const currentScope = useScope(overrideScopes)[`__scope${scopeName}`];
        return {
          ...nextScopes2,
          ...currentScope
        };
      }, {});
      return React.useMemo(() => ({
        [`__scope${baseScope.scopeName}`]: nextScopes
      }), [nextScopes]);
    };
  }, "createScope");
  return createScope.scopeName = baseScope.scopeName, createScope;
}
__name(composeContextScopes, "composeContextScopes");

// node_modules/.pnpm/@tamagui+helpers@1.135.2_re_c1ec808f7ac5b119c6d4c8071696c131/node_modules/@tamagui/helpers/dist/esm/composeEventHandlers.mjs
function composeEventHandlers(og, next, {
  checkDefaultPrevented = true
} = {}) {
  return !og || !next ? next || og || void 0 : (event) => {
    if (og?.(event), !event || !(checkDefaultPrevented && typeof event == "object" && "defaultPrevented" in event) || // @ts-ignore
    "defaultPrevented" in event && !event.defaultPrevented) return next?.(event);
  };
}
__name(composeEventHandlers, "composeEventHandlers");

// node_modules/.pnpm/@tamagui+constants@1.135.2__e6c302c2a15a69c7e11a03e84a5cdd3a/node_modules/@tamagui/constants/dist/esm/constants.mjs
var import_react = require("react");
var import_react2 = require("react");
var isWeb = true;
var isWindowDefined = typeof window < "u";
var isClient = isWeb && isWindowDefined;
var isChrome = typeof navigator < "u" && /Chrome/.test(navigator.userAgent || "");
var isWebTouchable = isClient && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
var isAndroid = false;
var isIos = process.env.TEST_NATIVE_PLATFORM === "ios";

// node_modules/.pnpm/@tamagui+helpers@1.135.2_re_c1ec808f7ac5b119c6d4c8071696c131/node_modules/@tamagui/helpers/dist/esm/validStyleProps.mjs
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

// node_modules/.pnpm/@tamagui+helpers@1.135.2_re_c1ec808f7ac5b119c6d4c8071696c131/node_modules/@tamagui/helpers/dist/esm/withStaticProperties.mjs
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

// node_modules/.pnpm/@tamagui+form@1.135.2_react_55b0eba07a9698dce5f99e5ef3127915/node_modules/@tamagui/form/dist/esm/Form.mjs
var import_jsx_runtime2 = require("react/jsx-runtime");
var FORM_NAME = "Form";
var FormFrame = (0, import_core.styled)(import_core.Stack, {
  name: FORM_NAME,
  tag: "form"
});
var [createFormContext] = createContextScope(FORM_NAME);
var [FormProvider, useFormContext] = createFormContext(FORM_NAME);
var TRIGGER_NAME = "FormTrigger";
var FormTriggerFrame = (0, import_core.styled)(import_core.View, {
  name: TRIGGER_NAME
});
var FormTrigger = FormTriggerFrame.styleable((props, forwardedRef) => {
  const {
    __scopeForm,
    children,
    onPress,
    ...triggerProps
  } = props, context = useFormContext(TRIGGER_NAME, __scopeForm);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FormTriggerFrame, {
    tag: "button",
    ...triggerProps,
    ref: forwardedRef,
    onPress: composeEventHandlers(onPress, context.onSubmit),
    children
  });
});
var FormComponent = FormFrame.extractable(function({
  onSubmit,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FormProvider, {
    scope: props.__scopeForm,
    onSubmit,
    children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FormFrame, {
      ...props,
      onSubmit: /* @__PURE__ */ __name((e) => e.preventDefault(), "onSubmit")
    })
  });
});
var Form2 = withStaticProperties(FormComponent, {
  Trigger: FormTrigger
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Form,
  FormFrame,
  FormProvider,
  FormTrigger,
  useFormContext
});
