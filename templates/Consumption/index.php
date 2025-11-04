<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <title>Suivi de consommation | RadiusDesk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.sencha.com/ext/gpl/7.5.0/build/classic/theme-crisp/resources/theme-crisp-all.css">
        <style>
            body {
                background: #0f172a;
                margin: 0;
                font-family: Arial, sans-serif;
            }
            .consumption-viewport .x-panel-body {
                background: linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #111827 100%);
            }
            .traffic-card .x-panel-body,
            .qos-card .x-panel-body {
                color: #fff;
                font-size: 15px;
                line-height: 1.6em;
            }
            .result-grid .x-grid-item-selected .x-grid-cell-inner {
                background-color: rgba(255, 23, 68, 0.25);
            }
        </style>
    </head>
    <body>
        <script src="https://cdn.sencha.com/ext/gpl/7.5.0/build/ext-all.js"></script>
        <script>
        Ext.application({
            name: 'ConsumptionApp',
            launch: function () {
                const API_KEY = '<?= h($apiKey) ?>';

                const usageStore = Ext.create('Ext.data.Store', {
                    fields: ['metric', 'value'],
                    data: []
                });

                const trafficPanel = Ext.create('Ext.panel.Panel', {
                    title: 'Trafic',
                    cls: 'traffic-card',
                    bodyPadding: 12,
                    html: '<strong>Analyse en cours...</strong>'
                });

                const qosPanel = Ext.create('Ext.panel.Panel', {
                    title: 'QoS',
                    cls: 'qos-card',
                    bodyPadding: 12,
                    html: '<strong>Analyse en cours...</strong>'
                });

                const resultsGrid = Ext.create('Ext.grid.Panel', {
                    cls: 'result-grid',
                    store: usageStore,
                    flex: 1,
                    columns: [
                        { text: 'Indicateur', dataIndex: 'metric', flex: 2 },
                        { text: 'Valeur', dataIndex: 'value', flex: 1 }
                    ]
                });

                const infoPanel = Ext.create('Ext.panel.Panel', {
                    title: 'Résultats',
                    iconCls: 'x-fa fa-chart-line',
                    layout: { type: 'vbox', align: 'stretch' },
                    items: [resultsGrid, { xtype: 'container', layout: 'hbox', flex: 0, items: [trafficPanel, qosPanel], defaults: { flex: 1, margin: '12 12 0 12' } }],
                    hidden: true
                });

                const statusBar = Ext.create('Ext.Component', {
                    margin: '10 0 0 0',
                    style: 'color:#f87171;font-weight:bold;'
                });

                function presentUsage(response) {
                    const identity = response.data.identity;
                    const usage = response.data.usage;
                    const other = response.other;

                    usageStore.loadData([
                        { metric: 'Utilisateur', value: identity.display + ' (' + identity.type + ')' },
                        { metric: 'Volume entrant', value: usage.total_input_mb + ' MB' },
                        { metric: 'Volume sortant', value: usage.total_output_mb + ' MB' },
                        { metric: 'Total', value: usage.total_combined_mb + ' MB' },
                        { metric: 'Sessions', value: usage.total_sessions },
                        { metric: 'Durée cumulée', value: Ext.Date.format(new Date(usage.total_time_seconds * 1000), 'H\hi\ms') }
                    ]);

                    trafficPanel.setTitle(other.traffic.title);
                    trafficPanel.update('<p>' + other.traffic.description + '</p>');
                    trafficPanel.setBodyStyle('background-color:' + other.traffic.color + ';');

                    qosPanel.setTitle(other.qos.title);
                    qosPanel.update('<p>' + other.qos.description + '</p>');
                    qosPanel.setBodyStyle('background-color:' + other.qos.color + ';');

                    if (response.data.last_session) {
                        statusBar.update('Dernière session : ' + (response.data.last_session.start || 'n/a') + ' → ' + (response.data.last_session.stop || 'en cours') + (response.data.last_session.nas_ip ? ' sur NAS ' + response.data.last_session.nas_ip : ''));
                    } else {
                        statusBar.update('Aucune session enregistrée.');
                    }

                    infoPanel.show();
                }

                function submitPayload(payload) {
                    statusBar.update('');
                    infoPanel.hide();
                    Ext.Ajax.request({
                        url: '/cake4/rd_cake/api/consumption/usage.json',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Api-Key': API_KEY
                        },
                        jsonData: payload,
                        success: function (response) {
                            const data = Ext.decode(response.responseText);
                            if (data.success) {
                                presentUsage(data);
                            } else {
                                statusBar.update('Réponse inattendue.');
                            }
                        },
                        failure: function (response) {
                            try {
                                const data = Ext.decode(response.responseText);
                                statusBar.update(data.message || 'Erreur lors de la récupération des données.');
                            } catch (e) {
                                statusBar.update('Erreur ' + response.status + ' – impossible de joindre le service.');
                            }
                        }
                    });
                }

                const userForm = Ext.create('Ext.form.Panel', {
                    bodyPadding: 15,
                    defaults: {
                        anchor: '100%',
                        allowBlank: false
                    },
                    items: [
                        { xtype: 'textfield', name: 'username', fieldLabel: 'Nom d’utilisateur', emptyText: 'permanent user' },
                        { xtype: 'textfield', name: 'password', inputType: 'password', fieldLabel: 'Mot de passe' }
                    ],
                    buttons: [{
                        text: 'Afficher la consommation',
                        formBind: true,
                        handler: function () {
                            const values = userForm.getValues();
                            submitPayload(Ext.apply({ type: 'user' }, values));
                        }
                    }]
                });

                const voucherForm = Ext.create('Ext.form.Panel', {
                    bodyPadding: 15,
                    defaults: {
                        anchor: '100%',
                        allowBlank: false
                    },
                    items: [
                        { xtype: 'textfield', name: 'voucher', fieldLabel: 'Code voucher', emptyText: 'ex: tensesense' },
                        { xtype: 'textfield', name: 'password', fieldLabel: 'PIN (optionnel)', allowBlank: true }
                    ],
                    buttons: [{
                        text: 'Afficher la consommation',
                        formBind: true,
                        handler: function () {
                            const values = voucherForm.getValues();
                            submitPayload(Ext.apply({ type: 'voucher' }, values));
                        }
                    }]
                });

                const tabs = Ext.create('Ext.tab.Panel', {
                    items: [
                        { title: 'Permanent', iconCls: 'x-fa fa-user', items: userForm },
                        { title: 'Voucher', iconCls: 'x-fa fa-ticket-alt', items: voucherForm }
                    ]
                });

                Ext.create('Ext.container.Viewport', {
                    cls: 'consumption-viewport',
                    layout: 'fit',
                    items: [{
                        xtype: 'panel',
                        title: 'Portail consommation RadiusDesk',
                        iconCls: 'x-fa fa-tachometer-alt',
                        bodyPadding: 20,
                        layout: {
                            type: 'vbox',
                            align: 'stretch'
                        },
                        defaults: { margin: '0 0 20 0' },
                        items: [
                            { xtype: 'component', html: '<h2 style="color:#f87171;">Trafic & QoS</h2><p style="color:#e2e8f0;">Connectez-vous avec vos identifiants pour visualiser instantanément la consommation et la santé QoS de votre session.</p>' },
                            tabs,
                            infoPanel,
                            statusBar
                        ]
                    }]
                });
            }
        });
        </script>
    </body>
</html>
