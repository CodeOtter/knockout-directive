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
	 * @param	Message
	 * @param	If true, the message is displayed, regardless if DEBUG is true or not.
	 */
	function debug(text, override) {
		if(DEBUG || override) {
			console.log(text);
		}
	}

	// Template engine
    var templateEngine = new ko.nativeTemplateEngine();

    /**
     * Converts a directive DOM into a template.
     * @param	Template name
     * @param	HTML markup for the template
     */
    templateEngine.addTemplate = function(templateName, templateMarkup) {
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

    // Default configuration for a directive
    
    /**
     * Creates a directive
     * 
     * @param	Name of the directive
     * @param	Templates the directive uses
     * @param	Configuration of the directive
     * 				replace:
     * 					True will template will overwrite the original directive DOM element.  False will append the template to the 
     *   				original directive DOM element,
     * 				share:
     * 					The directive's view model will be bound to all descendants.  False by default.
     * 				autorender:
     * 					Automatically render the template after it has been initialized.  True by default.
     * 				view:
     * 					Use a custom view model.  If blank, will use the view passed into the binding.
     * @param	View definition to use
     * @param	Binding initialization method
     * @param	Binding update method
     */
    function Directive(name, templates, config, View, init, update) {
    	var self = this;

    	// For object-based configuration
    	if(typeof name == 'object') {
    		update = name.update;
    		init = name.init;
    		View = name.view;
    		config = name.config;
    		templates = name.templates;
    		name = name.name;
    	}
    	
    	// Default configuration options
    	var defaultConfig = {
			replace: true,
			share: false,
			render: true,
			view: false,
			debug: false
		};

    	// Backwards compatibility
    	if(init == undefined && update == undefined) {
    		update = init;
    		init = View;
    		View = config;
    		config = defaultConfig;
    	} else {
        	if(config == null) {
        		config = {};
        	}
        	config = ko.utils.extend(defaultConfig, config);
    	}

    	debug('====================================================', config.debug);
    	debug('Instantiating directive: ' + name, config.debug);
    	debug(config, config.debug);
    	
    	// Templates
    	self.templates = templates;
    	for(var i in self.templates) {
            if(this.templates.hasOwnProperty(i) && self.templates[i]) {
            	debug('Adding template: ' + i, config.debug);
                templateEngine.addTemplate(i, self.templates[i]);
            }
        }

    	// Create the view model
    	var view = null;

    	if(config.view) {
    		// Use a custom view
    		View = config.view;
    	}

    	debug('Using ViewModel: ', config.debug);
    	debug(View, config.debug);

    	if(View) {
    		view = new View();
    	}
    	
    	// Add the directive to the binding handlers
        ko.bindingHandlers[name] = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            	debug('Preparing directive: ' + name, config.debug);

            	var value = ko.unwrap(valueAccessor());

            	debug('Value accessor:', config.debug);
            	debug(value, config.debug);

            	debug('Creating view instance...', config.debug);

            	var viewInstance = null;
            	if(config.share) {
            		// Share the bindings of the parent with the children
            		viewInstance = bindingContext.extend(value);
            	} else {
            		// Create a brand new context for the child
            		viewInstance = bindingContext.createChildContext(value);
            	}

                if(init) {
                	debug('Initializing directive: ' + name, config.debug);
                	debug([element, value, allBindingsAccessor, view, viewInstance], config.debug);

                	// Initialize the Directive
                	init(element, value, allBindingsAccessor, view, viewInstance);
                }

                if(config.render) {

                	debug('Rendering: ' + name, config.debug);
                	debug([name, viewInstance, element, config.replace], config.debug);

                	// Automatically render the directive
                	self.render(name, viewInstance, element, config.replace);
                }

                debug('Sharing bindings with children: ' + config.share, config.debug);

                return { 'controlsDescendantBindings': config.share };
            },
            update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            	if(update) {
            		update(element, ko.unwrap(valueAccessor()), allBindings, view, bindingContext);
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
    Directive.prototype.render = function(templateName, viewInstance, targetElement, replace, share) {
    	if(this.templates[templateName]) {
    		// Render the template if it's found
    		debug('Rendering template: ' + templateName);
    		debug([templateName, viewInstance, { templateEngine: templateEngine }, targetElement, replace ? 'replaceNode' : 'replaceChildren']);

            ko.renderTemplate(
                templateName,
                viewInstance,
                { templateEngine: templateEngine },
                targetElement,
                replace ? 'replaceNode' : 'replaceChildren' 
            );
        	ko.applyBindingsToDescendants(viewInstance, targetElement);
    	} else {
    		debug('Applying root-level bindings:');
    		debug([ viewInstance, targetElement ]);

    		// There is no template, apply root-level bindings
    		ko.applyBindingsToDescendants(viewInstance, targetElement);
    	}
    };

    // Returns a Directive factory for RequireJS
    return function(name, templates, config, View, init, update) {
    	return new Directive(name, templates, config, View, init, update);
    };
});
