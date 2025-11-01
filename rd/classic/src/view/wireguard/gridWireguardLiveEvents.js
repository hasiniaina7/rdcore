Ext.define('Rd.view.wireguard.gridWireguardLiveEvents' ,{
    extend      :'Ext.grid.Panel',
    alias       : 'widget.gridWireguardLiveEvents',
    multiSelect : true,
    store       : 'sWireguardLiveEvents',
    stateful    : true,
    stateId     : 'StateGridWireguardLiveEvents',
    stateEvents :['groupclick','columnhide'],
    border      : false,
    padding     : 0,
    ui          : 'light',
    columnLines : false,
    rowLines    : false,
    stripeRows  : true,
    viewConfig  : {
        loadMask    :true
    },
    listeners       : {
     //   activate  : 'onViewActivate'
    },
    requires    : [
        'Rd.view.wireguard.vcWireguardLiveEvents',
    ],
    controller  : 'vcWireguardLiveEvents',
    tbar: [
        { xtype : 'btnGrpRefreshAndTimespan' }
    ],
    initComponent: function(){
        var me     = this;
        me.store   = Ext.create('Rd.store.sWireguardLiveEvents');
                
        me.columns  = [
            {
                text        : 'Time',
                dataIndex   : 'ts',
                width       : 150,
                renderer    : function(v){
                    if(!v){ return ''; }
                    const s         = Ext.Date.format(v, 'Y-m-d H:i:s');
                    const ageSec    = Math.floor((Date.now()-v.getTime())/1000);
                    return s + ` <span style="color:#666;">(${ageSec}s ago)</span>`;
                }
            },
            {
                text        : 'Event',
                dataIndex   : 'event',
                width       : 130,
                renderer    : function(v){
                    const m = {
                        connected   : { txt:'CONNECTED',   bg:'#e8fff0', fg:'#2caa18' },
                        disconnected: { txt:'DISCONNECTED',bg:'#fff3e6', fg:'#c27819' },
                        appeared    : { txt:'APPEARED',    bg:'#eef2ff', fg:'#001cb0' },
                        updated     : { txt:'UPDATED',     bg:'#f5f5f5', fg:'#444' }
                    };
                    const o = m[v] || m.updated;
                    return `<span style="padding:2px 6px;border-radius:10px;background:${o.bg};color:${o.fg};font-weight:bold;">${o.txt}</span>`;
                }
            },
            {
                text        : 'Interface',
                dataIndex   : 'iface',
                width       : 90
            },
            {
                text        : 'Public Key',
                dataIndex   : 'public_key',
                flex        : 1,
                renderer    : v => `<code>${Ext.htmlEncode(v)}</code>`
            },
            {
                text        : 'Endpoint',
                dataIndex   : 'endpoint',
                width       : 180
            }
        ]; 
        me.callParent(arguments);
    }
});
