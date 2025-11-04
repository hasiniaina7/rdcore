/**
 * This class is the controller for the main view for the application. It is specified as
 * the "controller" of the Main view class.
 */
Ext.define('ConsumptionPortal.view.main.MainController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.main',

    onUserSubmit: function () {
        const form = this.lookupReference('userForm');
        if (form && form.isValid()) {
            const values = form.getValues();
            this.submitPayload(Ext.apply({ type: 'user' }, values));
        }
    },

    onVoucherSubmit: function () {
        const form = this.lookupReference('voucherForm');
        if (form && form.isValid()) {
            const values = form.getValues();
            this.submitPayload(Ext.apply({ type: 'voucher' }, values));
        }
    },

    submitPayload: function (payload) {
        const vm = this.getViewModel();
        const infoPanel = this.lookupReference('infoPanel');
        const statusBar = this.lookupReference('statusBar');

        if (infoPanel) {
            infoPanel.hide();
        }
        if (statusBar) {
            statusBar.setHtml('');
        }

        Ext.Ajax.request({
            url: vm.get('apiUrl'),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': vm.get('apiKey')
            },
            jsonData: payload,
            scope: this,
            success: this.onUsageSuccess,
            failure: this.onUsageFailure
        });
    },

    onUsageSuccess: function (response) {
        let payload = null;
        try {
            payload = Ext.decode(response.responseText);
        } catch (e) {
            this.updateStatus('Réponse illisible du service.');
            return;
        }

        if (payload && payload.success) {
            this.presentUsage(payload);
        } else {
            this.updateStatus('Réponse inattendue.');
        }
    },

    onUsageFailure: function (response) {
        let message = 'Erreur ' + response.status + ' – impossible de joindre le service.';
        try {
            const payload = Ext.decode(response.responseText);
            if (payload && payload.message) {
                message = payload.message;
            }
        } catch (e) {
            // keep default message
        }
        this.updateStatus(message);
    },

    presentUsage: function (payload) {
        const vm = this.getViewModel();
        const usage = payload.data.usage;
        const identity = payload.data.identity;
        const lastSession = payload.data.last_session;
        const other = payload.other || {};
        const usageStore = vm.getStore('usage');

        if (usageStore) {
            usageStore.loadData([
                { metric: 'Utilisateur', value: identity.display + ' (' + identity.type + ')' },
                { metric: 'Volume entrant', value: usage.total_input_mb + ' MB' },
                { metric: 'Volume sortant', value: usage.total_output_mb + ' MB' },
                { metric: 'Total', value: usage.total_combined_mb + ' MB' },
                { metric: 'Sessions', value: usage.total_sessions },
                { metric: 'Durée cumulée', value: this.formatDuration(usage.total_time_seconds) }
            ]);
        }

        const trafficPanel = this.lookupReference('trafficPanel');
        if (trafficPanel) {
            const traffic = other.traffic || {};
            trafficPanel.setTitle(traffic.title || 'Trafic');
            trafficPanel.update('<p>' + (traffic.description || 'n/a') + '</p>');
            trafficPanel.setBodyStyle('background-color:' + (traffic.color || '#991b1b') + ';color:#fff;');
        }

        const qosPanel = this.lookupReference('qosPanel');
        if (qosPanel) {
            const qos = other.qos || {};
            qosPanel.setTitle(qos.title || 'QoS');
            qosPanel.update('<p>' + (qos.description || 'n/a') + '</p>');
            qosPanel.setBodyStyle('background-color:' + (qos.color || '#7f1d1d') + ';color:#fff;');
        }

        if (lastSession) {
            const start = lastSession.start || 'n/a';
            const stop = lastSession.stop || 'en cours';
            const nas = lastSession.nas_ip ? ' sur NAS ' + lastSession.nas_ip : '';
            this.updateStatus('Dernière session : ' + start + ' → ' + stop + nas);
        } else {
            this.updateStatus('Aucune session enregistrée.');
        }

        const infoPanel = this.lookupReference('infoPanel');
        if (infoPanel) {
            infoPanel.show();
        }
    },

    formatDuration: function (seconds) {
        if (!Ext.isNumber(seconds) || seconds <= 0) {
            return '0s';
        }
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const parts = [];
        if (hrs) {
            parts.push(hrs + 'h');
        }
        if (mins) {
            parts.push(mins + 'm');
        }
        if (secs || !parts.length) {
            parts.push(secs + 's');
        }
        return parts.join(' ');
    },

    updateStatus: function (message) {
        const statusBar = this.lookupReference('statusBar');
        if (statusBar) {
            statusBar.setHtml(message || '');
        }
    }
});
