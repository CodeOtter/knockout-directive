knockout-directive
==================

AngularJS directive-like functionality for custom bindings.  (Now with 100% less weird text-based flags)  This makes creating reusable UI components pretty easy as it obfuscating many template/binding issues.

You'll need RequireJS and jQuery to make this work.

Super simple example:

```JavaScript
DirectiveBinding({
  name: 'helpOverlay',
  templates: {
    'helpOverlay': '<div data-bind="visible: active"></div>'
  }
});
```

Then you use it by dropping this in your HTML:

```HTML
   <div data-bind="helpOverlay: { active: true }></div>"
```

And you're done!

Advanced
========

Directive also allows for parameter-based invocation:


```JavaScript
var helpOverlay = DirectiveBinding(
  /* Name of the binding */
  'helpOverlay', 
  
  /* Templates */
  {
    'helpOverlay':  // Name of the template
      /* HTML of the directive */
      '<div data-bind="visible: active"></div>'
  },
		
  /* Configuration of the directive */
  {
    replace: true, // If true, overwrites the original directive DOM element with the template.
                   // If false, appends the template to the original directive DOM element.
    share: true,   // If true, the view model will be bound to all descendants.
                   // If false, the view model will only be bound to the DOM element.
    render: true,  // If true, automatically renders the template after it has been initialized.
    view: null,    // Use a custom view model.  If blank, will use the view passed into the directive argument.
    debug: false,  // Turns on debug messaging for this directive.
    bind: true,    // If true, binds the view model to the DOM element.
    master: false, // If true, allows the directive to control the descendant bindings of all children.
    merge: false   // If true, merges the value accessor and the view model with the parent binding.  
                   // If false, creates a new child context with the value accessor and view model as the context.
  },
		
  /* The view model the directive will use */
  {
     test: function() {
       console.log(this.active);
     }
  },
  
  /* The initialization of the directive.  All values passed into the binding will be availible in the viewModel */
  function(element, value, allBindingsAccessor, viewModel, bindingContext) {
    viewModel.test();
  }
);
```
