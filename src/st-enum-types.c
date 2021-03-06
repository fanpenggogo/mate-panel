
/* Generated data (by glib-mkenums) */

#include "st-enum-types.h"
/* enumerations from "./st/st-button.h" */
#include "./st/st-button.h"
GType
st_button_mask_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GFlagsValue values[] = {
        { ST_BUTTON_ONE, "ST_BUTTON_ONE", "one" },
        { ST_BUTTON_TWO, "ST_BUTTON_TWO", "two" },
        { ST_BUTTON_THREE, "ST_BUTTON_THREE", "three" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_flags_register_static (g_intern_static_string ("StButtonMask"), values);
    }
  return enum_type_id;
}
/* enumerations from "./st/st-clipboard.h" */
#include "./st/st-clipboard.h"
GType
st_clipboard_type_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GEnumValue values[] = {
        { ST_CLIPBOARD_TYPE_PRIMARY, "ST_CLIPBOARD_TYPE_PRIMARY", "primary" },
        { ST_CLIPBOARD_TYPE_CLIPBOARD, "ST_CLIPBOARD_TYPE_CLIPBOARD", "clipboard" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_enum_register_static (g_intern_static_string ("StClipboardType"), values);
    }
  return enum_type_id;
}
/* enumerations from "./st/st-table.h" */
#include "./st/st-table.h"
GType
st_table_child_options_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GFlagsValue values[] = {
        { ST_KEEP_ASPECT_RATIO, "ST_KEEP_ASPECT_RATIO", "keep-aspect-ratio" },
        { ST_X_EXPAND, "ST_X_EXPAND", "x-expand" },
        { ST_Y_EXPAND, "ST_Y_EXPAND", "y-expand" },
        { ST_X_FILL, "ST_X_FILL", "x-fill" },
        { ST_Y_FILL, "ST_Y_FILL", "y-fill" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_flags_register_static (g_intern_static_string ("StTableChildOptions"), values);
    }
  return enum_type_id;
}
/* enumerations from "./st/st-texture-cache.h" */
#include "./st/st-texture-cache.h"
GType
st_texture_cache_policy_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GEnumValue values[] = {
        { ST_TEXTURE_CACHE_POLICY_NONE, "ST_TEXTURE_CACHE_POLICY_NONE", "none" },
        { ST_TEXTURE_CACHE_POLICY_FOREVER, "ST_TEXTURE_CACHE_POLICY_FOREVER", "forever" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_enum_register_static (g_intern_static_string ("StTextureCachePolicy"), values);
    }
  return enum_type_id;
}
/* enumerations from "./st/st-theme-node.h" */
#include "./st/st-theme-node.h"
GType
st_side_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GEnumValue values[] = {
        { ST_SIDE_TOP, "ST_SIDE_TOP", "top" },
        { ST_SIDE_RIGHT, "ST_SIDE_RIGHT", "right" },
        { ST_SIDE_BOTTOM, "ST_SIDE_BOTTOM", "bottom" },
        { ST_SIDE_LEFT, "ST_SIDE_LEFT", "left" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_enum_register_static (g_intern_static_string ("StSide"), values);
    }
  return enum_type_id;
}
GType
st_corner_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GEnumValue values[] = {
        { ST_CORNER_TOPLEFT, "ST_CORNER_TOPLEFT", "topleft" },
        { ST_CORNER_TOPRIGHT, "ST_CORNER_TOPRIGHT", "topright" },
        { ST_CORNER_BOTTOMRIGHT, "ST_CORNER_BOTTOMRIGHT", "bottomright" },
        { ST_CORNER_BOTTOMLEFT, "ST_CORNER_BOTTOMLEFT", "bottomleft" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_enum_register_static (g_intern_static_string ("StCorner"), values);
    }
  return enum_type_id;
}
GType
st_text_decoration_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GFlagsValue values[] = {
        { ST_TEXT_DECORATION_UNDERLINE, "ST_TEXT_DECORATION_UNDERLINE", "underline" },
        { ST_TEXT_DECORATION_OVERLINE, "ST_TEXT_DECORATION_OVERLINE", "overline" },
        { ST_TEXT_DECORATION_LINE_THROUGH, "ST_TEXT_DECORATION_LINE_THROUGH", "line-through" },
        { ST_TEXT_DECORATION_BLINK, "ST_TEXT_DECORATION_BLINK", "blink" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_flags_register_static (g_intern_static_string ("StTextDecoration"), values);
    }
  return enum_type_id;
}
GType
st_text_align_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GEnumValue values[] = {
        { ST_TEXT_ALIGN_LEFT, "ST_TEXT_ALIGN_LEFT", "left" },
        { ST_TEXT_ALIGN_CENTER, "ST_TEXT_ALIGN_CENTER", "center" },
        { ST_TEXT_ALIGN_RIGHT, "ST_TEXT_ALIGN_RIGHT", "right" },
        { ST_TEXT_ALIGN_JUSTIFY, "ST_TEXT_ALIGN_JUSTIFY", "justify" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_enum_register_static (g_intern_static_string ("StTextAlign"), values);
    }
  return enum_type_id;
}
GType
st_gradient_type_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GEnumValue values[] = {
        { ST_GRADIENT_NONE, "ST_GRADIENT_NONE", "none" },
        { ST_GRADIENT_VERTICAL, "ST_GRADIENT_VERTICAL", "vertical" },
        { ST_GRADIENT_HORIZONTAL, "ST_GRADIENT_HORIZONTAL", "horizontal" },
        { ST_GRADIENT_RADIAL, "ST_GRADIENT_RADIAL", "radial" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_enum_register_static (g_intern_static_string ("StGradientType"), values);
    }
  return enum_type_id;
}
/* enumerations from "./st/st-types.h" */
#include "./st/st-types.h"
GType
st_align_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GEnumValue values[] = {
        { ST_ALIGN_START, "ST_ALIGN_START", "start" },
        { ST_ALIGN_MIDDLE, "ST_ALIGN_MIDDLE", "middle" },
        { ST_ALIGN_END, "ST_ALIGN_END", "end" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_enum_register_static (g_intern_static_string ("StAlign"), values);
    }
  return enum_type_id;
}
GType
st_background_size_get_type(void) {
  static GType enum_type_id = 0;
  if (G_UNLIKELY (!enum_type_id))
    {
      static const GEnumValue values[] = {
        { ST_BACKGROUND_SIZE_AUTO, "ST_BACKGROUND_SIZE_AUTO", "auto" },
        { ST_BACKGROUND_SIZE_CONTAIN, "ST_BACKGROUND_SIZE_CONTAIN", "contain" },
        { ST_BACKGROUND_SIZE_COVER, "ST_BACKGROUND_SIZE_COVER", "cover" },
        { ST_BACKGROUND_SIZE_FIXED, "ST_BACKGROUND_SIZE_FIXED", "fixed" },
        { 0, NULL, NULL }
      };
      enum_type_id = g_enum_register_static (g_intern_static_string ("StBackgroundSize"), values);
    }
  return enum_type_id;
}

/* Generated data ends here */

