ww-config.js
options.autoByContent
Type: boolean (default false)
Available for Element only
Description: If true, width = auto will use your element size instead of the parent available space.
For an example see the behavior of ww-button

options.sizable
Type: boolean (default false)
Available for Element only
Description: If true, the editor will display handle to resize your element visually.
For an example see the behavior of ww-image

options.hyperlink
Type: boolean (default false)
Available for Element only
Description: If true, the editor will allow your component to be wrap inside an a tag.
editor.label
Type: translated text
Available for Section and Element
Mandatory
Description: This is the text use by the editor to label your component through the interface (menu, navigator, ...)
editor.noHover
Type: boolean (default false)
Available for Element only
Description: If true, the editor will not display an hover effect. Use this property if you want to handle yourself what you display on hover
editor.infoTag
Type: InfoTag or InfoTag[] or Function returning InfoTag or InfoTag[]
Available for Section and Element
Description: Let you add small tags info on your component floating menu.
editor.bubble
Type: Boolean or {icon?: String; color?: String;}
Available for Element only
Description: Let you add a small bubble in the left top corner. Usefull for selection of container when children take all the content space.
ts
type InfoTag = {
  color: string;
  backgroundColor: string;
  text?: string;
  icon?: string;
  action: function;
};
properties
Type: An object with property name as key, and a property as value
Available for Section and Element
Description: Let you describe all your content properties
triggerEvents
Type: Array<{ name: String, label: translated text }>
Available for Element only
Description: Let you describe all the custom event your component can emit. Useful for custom workflows