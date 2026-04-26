weweb.io is a no-code web-app builder where you can drag-and-drop different customizable blocks.

Every time you hit publish, we build a JavaScript (Vue.js) application.

Then, we prerender each page from it that we host on a content delivery network. Search engines can load them fast and read them easily, improving SEO and overall user-experience.

Core concepts
When you build a WeWeb web-app, you use two type of blocks: Sections and Elements (see below for difference).

Under the hood, these two types of blocks are standard Vue components that have special props (see [component interface.md](component%20interface.md)) so that the WeWeb Editor can communicate with them.

We provide a lot of base elements (like editable text or image), but you can also develop your own. They are fully customizable and, when you import them in a WeWeb project, they will be usable by builders inside the WeWeb Editor in the same way as our core components (i.e. you will be able to drag-and-drop them on a page and edit their style with no-code).

Each element or section have what we call a content: it's a data object that holds your custom properties. There are two contexts when your element or section can be loaded: inside the editor (Editor mode) or inside the published web-app (Front mode). In Editor mode the content is editable by the user, and saved on our database on each change. In Front mode the content can only change if it is bound to a dynamic value.

You can use the configuration file (see [ww-config doc.md](ww-config%20doc.md)) to use our build in logic to edit your section/element content, or handle yourself the edition interface. We have a strip logic available, so even if your element/section has a heavy editing logic, this will have no impact on the published web-app.

Your custom components will inherit the base edition interface (see [weweb io objects.md](weweb%20io%20objects.md)), like size, background color or border. Remember that a WeWeb user expects to edit them. You'll want to write your style and javascript with this in mind.

If you want to provide values for these WeWeb properties (padding for example), we advise you to drop an instance of your component inside the Editor, change the needed values with the Editor interface, and then save them inside the Design System. The Component source code is responsible for handling content/custom logic, and the Design system is the way to save style/preset of your components.

Section vs Element
A Section is a large block inside WeWeb. Sections are standalone, and cannot be used inside other components. They offer less edition option, but are easier to design because you have more control on the layout they will appear in (they will be a direct child of your page)

An Element is a smaller block. Elements can be used by Sections or other Elements and can be repeated.

TIP

Use a Section if you need to master the layout of your Component or if you will not use it inside other Components. Otherwise go for an Element.