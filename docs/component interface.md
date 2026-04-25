Component interface
Props
content
Type: Object
Available for Section and Element
Available in Editor and Front context
uid
Type: String ID
Available for Section and Element
Available in Editor and Front context
wwEditorState
Type: Object
Available for Section and Element
Available in Editor context only
js
const wwEditorState = {
  editMode: wwLib.wwEditorHelper.EDIT_MODES.EDITION,
  isSelected: false,
  isDoubleSelected: false,
  isHovered: false,
  sidepanelContent: {},
  isACopy: false,
  boundProps: {
    data: true,
    fontSize: false,
  },
};
wwFrontState
Type: Object
Available for Section and Element
Available in Editor and Front context
js
const wwFrontState = {
  lang: "en",
  pageId: "123544",
  sectionId: "123456",
  screenSize: "desktop",
  screnSizes: ["desktop", "tablet", "mobile"],
};
WARNING

You will probably never use this property, as weweb.io already handle responsive and translation logic for you

wwElementState
Type: Object
Available for Element only
Available in Editor and Front context
Its a special property for advanced usage, basically to pass custom props to your component.

js
const wwElementState = {
  props: {},
  isInsideLink: false,
  name: "My element",
};
Event
js
// Inside your component methods you can do
this.$emit("update:content", {
  /*... */
});
update:content
Type: Object
Available for Section and Element
Available in Editor only
See also Update content
update:content:effect
Type: Object
Available for Section and Element
Available in Editor only
See also Update content
trigger-event
Type: "{name: String, payload: any}"
Available in Editor and Front context
Description: Trigger workflow event
element-event
Type: any
Available in Editor and Front context
Description: Trigger event that will be available for the parent element
update:sidepanel-content
Type: { value: any, path: string }
Available for Section and Element
Available in Editor only
See also Custom editor interface
change-menu-visibility
Type: `Boolean
Available for Element only
Available in Editor only Toogle menu visibility. Use by certain element to hide the menu