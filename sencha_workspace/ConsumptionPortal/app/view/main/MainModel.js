/**
 * This class is the view model for the Main view of the application.
 */
Ext.define('ConsumptionPortal.view.main.MainModel', {
    extend: 'Ext.app.ViewModel',

    alias: 'viewmodel.main',

    data: {
        name: 'Portail consommation RadiusDesk',
        apiKey: 'b4c6ac81-8c7c-4802-b50a-0a6380555b50',
        apiUrl: '/cake4/rd_cake/api/consumption/usage.json',
        heroTitle: '<h2 style="color:#f87171;">Trafic & QoS</h2>',
        heroCopy: '<p style="color:#e2e8f0;">Connectez-vous avec vos identifiants pour visualiser instantanément la consommation et la santé QoS de votre session.</p>'
    },

    stores: {
        usage: {
            fields: ['metric', 'value'],
            data: []
        }
    }
});
