weweb.io objects
Editor properties
weweb.io Editor handle by default some properties of your component listed below. Do not handle them yourself

Section
Height of the root html element
Max width of the root html element
Positioning of the root html element content
Padding and margin of the root html element
Background of the root html element
Borders and Shadow of the root html element
Tag of the root element
Element
Width, max-width, height of the root html element
Positioning of the root html element content
Padding and margin of the root html element
Background of the root html element
Borders and Shadow of the root html element
Id and class of the root element
Link wrapping your whole element
Translated text
weweb.io use a custom way to handle translation. We use object with lang as key to store the different variants. Value can be anything (usefull for handle any kind of content which need to change depending on the locale)

To "translate", use wwLib.wwLang.

See also Add a translated text property

wwLib global variable
wwLib.wwLang
wwLib.createElement
wwLib.createElementFromTemplate
wwLib.getFrontWindow
Global components and directive
wwLayout component
This is a Vue component which allow to have a dropzone. See more here.

It just repeat children elements, and handle drag and drop for you. You still need to handle the css yourself.

Available props:

tag: String: change the tag root element
direction: 'column' | 'row' (default column): Change the ux of the dropzone. You are still responsible of the css to display children
disableDragDrop: Boolean (default false): Disable the drag and drop if you are handling child add/remove yourself
Events:

update:list: Emit each time a child element is added or removed
wwElement component
wwEditableText component
ww-responsive directive