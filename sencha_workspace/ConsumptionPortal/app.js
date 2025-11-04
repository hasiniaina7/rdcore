/*
 * This file launches the application by asking Ext JS to create
 * and launch() the Application class.
 */
Ext.application({
    extend: 'ConsumptionPortal.Application',

    name: 'ConsumptionPortal',

    requires: [
        // This will automatically load all classes in the ConsumptionPortal namespace
        // so that application classes do not need to require each other.
        'ConsumptionPortal.*'
    ],

    // The name of the initial view to create.
    mainView: 'ConsumptionPortal.view.main.Main'
});
