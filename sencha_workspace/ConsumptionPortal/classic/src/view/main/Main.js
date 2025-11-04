/**
 * This class is the main view for the application. It is specified in app.js as the
 * "mainView" property. That setting automatically applies the "viewport"
 * plugin causing this view to become the body element (i.e., the viewport).
 *
 * TODO - Replace this content of this view to suite the needs of your application.
 */
Ext.define('ConsumptionPortal.view.main.Main', {
    extend: 'Ext.panel.Panel',
    xtype: 'app-main',

    requires: [
        'Ext.plugin.Viewport',
        'Ext.form.Panel',
        'Ext.form.field.Text',
        'Ext.tab.Panel',
        'Ext.grid.Panel',
        'Ext.layout.container.VBox',
        'Ext.layout.container.HBox',
        'ConsumptionPortal.view.main.MainController',
        'ConsumptionPortal.view.main.MainModel'
    ],

    controller: 'main',
    viewModel: 'main',

    cls: 'consumption-viewport',
    plugins: 'viewport',
    bodyPadding: 20,
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    defaults: {
        margin: '0 0 20 0'
    },

    items: [{
        xtype: 'component',
        bind: {
            html: '{heroTitle}{heroCopy}'
        }
    }, {
        xtype: 'tabpanel',
        ui: 'navigation',
        items: [{
            title: 'Permanent',
            iconCls: 'x-fa fa-user',
            layout: 'fit',
            items: [{
                xtype: 'form',
                reference: 'userForm',
                bodyPadding: 15,
                defaults: {
                    anchor: '100%',
                    allowBlank: false
                },
                items: [{
                    xtype: 'textfield',
                    name: 'username',
                    fieldLabel: 'Nom d\'utilisateur',
                    emptyText: 'permanent user'
                }, {
                    xtype: 'textfield',
                    name: 'password',
                    inputType: 'password',
                    fieldLabel: 'Mot de passe'
                }],
                buttons: [{
                    text: 'Afficher la consommation',
                    formBind: true,
                    handler: 'onUserSubmit'
                }]
            }]
        }, {
            title: 'Voucher',
            iconCls: 'x-fa fa-ticket-alt',
            layout: 'fit',
            items: [{
                xtype: 'form',
                reference: 'voucherForm',
                bodyPadding: 15,
                defaults: {
                    anchor: '100%',
                    allowBlank: false
                },
                items: [{
                    xtype: 'textfield',
                    name: 'voucher',
                    fieldLabel: 'Code voucher',
                    emptyText: 'ex: tensesense'
                }, {
                    xtype: 'textfield',
                    name: 'password',
                    fieldLabel: 'PIN (optionnel)',
                    allowBlank: true
                }],
                buttons: [{
                    text: 'Afficher la consommation',
                    formBind: true,
                    handler: 'onVoucherSubmit'
                }]
            }]
        }]
    }, {
        xtype: 'panel',
        reference: 'infoPanel',
        hidden: true,
        cls: 'results-panel',
        title: 'Résultats',
        iconCls: 'x-fa fa-chart-line',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [{
            xtype: 'grid',
            flex: 1,
            cls: 'result-grid',
            bind: {
                store: '{usage}'
            },
            columns: [{
                text: 'Indicateur',
                dataIndex: 'metric',
                flex: 2
            }, {
                text: 'Valeur',
                dataIndex: 'value',
                flex: 1
            }]
        }, {
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            defaults: {
                flex: 1,
                margin: '12 12 0 12'
            },
            items: [{
                xtype: 'panel',
                reference: 'trafficPanel',
                cls: 'traffic-card',
                title: 'Trafic',
                bodyPadding: 12,
                html: '<strong>Analyse en cours...</strong>'
            }, {
                xtype: 'panel',
                reference: 'qosPanel',
                cls: 'qos-card',
                title: 'QoS',
                bodyPadding: 12,
                html: '<strong>Analyse en cours...</strong>'
            }]
        }]
    }, {
        xtype: 'component',
        reference: 'statusBar',
        cls: 'status-bar',
        html: ''
    }]
});
