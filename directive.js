/**
 * Directive
 * Operates like directives in Angular JS
 */
define(['core/knockout-2.3.0', 'jquery', 'config'], 
function(ko, $, Config) {

    // Master debug mode flag
    var DEBUG = false;

    /**
     * Displays a debug message in the console.
     * @param    Message
     * @param    If true, the message is displayed, regardless if DEBUG is true or not.
     */
    function debug(text, override) {
        if(DEBUG || override) {
            console.log(text);
        }
    }

    // Template engine
    var templateEngine = new ko.nativeTemplateEngine();

    // Default configuration for a directive
    
    /**
     * Creates a directive
     * 
     * @param    Name of the directive
     * @param    Templates the directive uses
     * @param    Configuration of the directive
     *               replace:
     *                   If true, overwrites the original directive DOM element with the template.
     *                   If false, appends the template to the original directive DOM element.  True by default.
     *               share:
     *                   If true, the view model will be bound to all descendants.
     *                   If false, the view model will only be bound to the DOM element.  True by default.
     *               render:
     *                   If true, automatically renders the template after it has been initialized.  True by default.
     *               view:
     *                   Use a custom view model.  If blank, will use the view passed into the binding.
     *               debug:
     *                   If true, turns on debugging for the binding.  False by default.
     *               bind:
     *                   If true, binds the view model to the DOM element.  True by default.
     *               master:
     *                   If true, allows the directive to control the descendant bindings of all children.  False by default.
     *               merge:
     *                   If true, merges the value accessor and the view model with the parent binding.  
     *                   If false, creates a new child context with the value accessor and view model as the context.  False by default.
     * @param    View definition to use
     * @param    Binding initialization method
     * @param    Binding update method
     */
    function Directive(name, templates, config, parentView, init, update) {
        var self = this;

        // For object-based configuration
        if(typeof name == 'object') {
            update = name.update;
            init = name.init;
            parentView = name.view;
            config = name.config;
            templates = name.templates;
            name = name.name;
        }

        // Default configuration options
        var defaultConfig = {
            replace: true,
            share: true,
            render: true,
            view: false,
            debug: false,
            bind: true,
            master: false,
            merge: false
        };

        // Backwards compatibility
        if(config == null) {
            config = {};
        }
        config = ko.utils.extend(defaultConfig, config);

        debug('====================================================', config.debug);
        debug('Loading directive: ' + name, config.debug);
        debug(config, config.debug);

        // Templates
        self.templates = templates;
        for(var i in self.templates) {
            if(self.templates.hasOwnProperty(i) && self.templates[i]) {
                debug('Adding template: ' + i, config.debug);
                self.addTemplate(i, self.templates[i]);
            }
        }

        // Create the view model
        var view = config.view || parentView || {};

        debug('Using ViewModel: ', config.debug);
        debug(view, config.debug);

        // Add the directive to the binding handlers
        ko.bindingHandlers[name] = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                debug('====================================================', config.debug);
                debug('Initializing directive: ' + name, config.debug);

                var value = ko.unwrap(valueAccessor());

                debug('Creating view instance...', config.debug);

                var viewInstance = ko.utils.extend(value, config.view || parentView || {});
                viewModel._instance = viewInstance
                debug(viewInstance, config.debug);
                var context = null;

                if(config.merge) {
                    // Merge the bindings of the parent with the children
                    debug('Creating extended context...', config.debug);
                    context = bindingContext.extend(viewInstance);
                } else {
                    // Create a brand new context for the child
                    debug('Creating child context...', config.debug);
                    context = bindingContext.createChildContext(viewInstance);
                }

                if(init) {
                    debug('Custom initialization running...', config.debug);
                    debug([element, viewInstance, context, allBindingsAccessor], config.debug);

                    // Initialize the Directive
                    init(element, viewInstance, context, allBindingsAccessor);
                }

                // Automatically render the directive
                if(config.render) {
                    self.render(name, context, element, config.replace, config.share, config.bind, config.debug);
                    debug('Sharing bindings with children: ' + config.master, config.debug);

                    return { 'controlsDescendantBindings': config.master };
                }
            },
            update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                if(update) {
                    update(element, ko.unwrap(valueAccessor()), allBindings, viewModel._instance, bindingContext);
                }
            }
        };
    }

    /**
     * Renders the directive
     * @param    
     * @param    
     * @param    
     */
    Directive.prototype.render = function(templateName, context, targetElement, replace, share, bind, log) {
        if(true) {
            // Render the template if it's found
            debug('------------------------------------------------------', log);
            debug('Rendering template: ' + templateName, log);
            debug([templateName, context, { templateEngine: templateEngine }, targetElement, replace ? 'replaceNode' : 'replaceChildren'], log);

            ko.renderTemplate(
                templateName,
                context,
                { templateEngine: templateEngine },
                targetElement,
                replace ? 'replaceNode' : 'replaceChildren' 
            );

            if(bind) {
                if(share) {
                    ko.applyBindingsToDescendants(context, targetElement);    
                } else {
                    ko.applyBindings(context, targetElement);
                }
            }
        } else {
            //debug('Applying root-level bindings:');
            //debug([ context, targetElement ]);

            // There is no template, apply root-level bindings
            //ko.applyBindingsToDescendants(context, targetElement);
        }
    };

    /**
     * Sets a value for a view model property during initialization
     * @param value
     * @param defaultValue
     * @param observableType
     */
    Directive.prototype.value = function(value, defaultValue, observableType) {
        if(observableType === undefined) {
            observableType = ko.observable;
        }

        if(ko.isObservable(value)) {
            // Dealing with an observable
            if(ko.unwrap(value) === undefined) {
                value(defaultValue);
            }
        } else {
            if(value === undefined) {
                // Dealing with a primitive
                if(observableType === null) {
                    value = defaultValue;
                } else {
                    value = observableType(defaultValue);
                }
            }
        }
        return value;
    };

    /**
     * Converts a directive DOM into a template.
     * @param    Template name
     * @param    HTML markup for the template
     */
    Directive.prototype.addTemplate = function(templateName, templateMarkup) {
        if(!document.getElementById(templateName)) {
            debug('Template does not exist.  Creating: ' + templateName);
            // Only create a script if it hasn't been loaded yet.
            var element = document.createElement('SCRIPT');
            element.setAttribute('type', 'text/html');
            element.setAttribute('id', templateName);
            element.text = templateMarkup;
            document.getElementsByTagName('body')[0].appendChild(element);
        }
    };

    // Returns a Directive factory for RequireJS
    return function(name, templates, config, parentView, init, update) {
        return new Directive(name, templates, config, parentView, init, update);
    };
});
