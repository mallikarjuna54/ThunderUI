/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2020 Metrological
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** The bluetooth plugin provides details on the available bluetooth devices, scans for new devices and allows the user to connect the device through UI
*/

import Plugin from '../core/plugin.js';

class BluetoothControl extends Plugin {

    constructor(pluginData, api) {
        super(pluginData, api);

        this._devices = [];
        this.scanning = false;
        this.displayName = 'BluetoothControl';
    }

    render()        {
        var mainDiv = document.getElementById('main');

        mainDiv.innerHTML = `
        <div class="title grid__col grid__col--8-of-8">
            Status
        </div>

        <div class="label grid__col grid__col--2-of-8">
            Devices
        </div>
        <div class="text grid__col grid__col--6-of-8">
            <select id="BT_Devices"></select>
        </div>
        <div class="label grid__col grid__col--2-of-8">
            Scanning
        </div>
        <div id="BT_Scanning" class="text grid__col grid__col--6-of-8">
            OFF
        </div>

        <div class="title grid__col grid__col--8-of-8">
            Device
        </div>
        <div class="label grid__col grid__col--2-of-8">
            Name
        </div>
        <div id="BT_Name" class="text grid__col grid__col--6-of-8">
            -
        </div>
        <div class="label grid__col grid__col--2-of-8">
            Type
        </div>
        <div id="BT_Type" class="text grid__col grid__col--6-of-8">
            -
        </div>
        <div class="label grid__col grid__col--2-of-8">
            Connected
        </div>
        <div id="BT_Connected" class="text grid__col grid__col--6-of-8">
            -
        </div>
        <div class="label grid__col grid__col--2-of-8">
            Paired
        </div>
        <div id="BT_Paired" class="text grid__col grid__col--6-of-8">
            -
        </div>

        <div class="label grid__col grid__col--2-of-8">Controls</div>
        <div class="text grid__col grid__col--6-of-8">
            <button type="button" id="BT_Connect">Connect</button>
            <button type="button" id="BT_Disconnect">Disconnect</button>
            <button type="button" id="BT_Pair">Pair</button>
            <button type="button" id="BT_Unpair">Unpair</button>
        </div>

        <div class="label grid__col grid__col--2-of-8">Remote</div>
        <div class="text grid__col grid__col--6-of-8">
            <button type="button" id="BT_Assign">Assign</button>
            <button type="button" id="BT_Revoke">Revoke</button>
        </div>

        <div class="title grid__col grid__col--8-of-8">
            Discovery
        </div>
        <div class="label grid__col grid__col--2-of-8">
            <label for="autofwd">Scan</label>
        </div>
        <div class="grid__col grid__col--6-of-8">
            <button type="button" id="BT_ScanForDevices">Scan</button>
        </div>
        <div class="label grid__col grid__col--2-of-8">
            BlueTooth Low Energy
        </div>
        <div class="grid__col grid__col--6-of-8">
            <div class="checkbox">
                <input type="checkbox" id="BT_LE" checked></input>
                <label for="BT_LE"></label>
            </div>
        </div>

        <br>

        <div id="statusMessages" class="text grid__col grid__col--8-of-8"></div>
        `;

        // bind elements

        // ---- button ----
        this.scanButton                 = document.getElementById('BT_ScanForDevices');
        this.pairButton                 = document.getElementById('BT_Pair');
        this.unpairButton               = document.getElementById('BT_Unpair');
        this.connectButton              = document.getElementById('BT_Connect');
        this.disconnectButton           = document.getElementById('BT_Disconnect');
        this.btLowEnergyButton          = document.getElementById('BT_LE');
        this.assignButton               = document.getElementById('BT_Assign');
        this.revokeButton               = document.getElementById('BT_Revoke');

        // ---- device list ----
        this.deviceList                 = document.getElementById('BT_Devices')
        this.deviceList.onchange        = this.renderDevice.bind(this);

        // Bind buttons
        this.scanButton.onclick         = this.scanForDevices.bind(this);
        this.pairButton.onclick         = this.pairDevice.bind(this);
        this.unpairButton.onclick       = this.unpairDevice.bind(this);
        this.disconnectButton.onclick   = this.disconnect.bind(this);
        this.connectButton.onclick      = this.connect.bind(this);
        this.assignButton.onclick       = this.assign.bind(this);
        this.revokeButton.onclick       = this.revoke.bind(this);

        // ---- Text fields
        this.nameEl                     = document.getElementById("BT_Name");
        this.typeEl                     = document.getElementById("BT_Type");
        this.connectedEl                = document.getElementById("BT_Connected");
        this.pairedEl                   = document.getElementById("BT_Paired")

        // ---- Status -----
        this.scanningStatus             = document.getElementById('BT_Scanning');
        this.statusMessages             = document.getElementById('statusMessages');

        // ---- Connected Devices -----
        this.deviceList                 = document.getElementById('BT_Devices');

        this.scanListener = this.api.t.on("BluetoothControl", "scancomplete",       this.scanComplete.bind(this));
        this.deviceStateListener = this.api.t.on("BluetoothControl", "devicestatechange",  this.render.bind(this));

        this.update()
    }

    /* ----------------------------- DATA ------------------------------*/

    devices() {
        const _rpc = {
            plugin : 'BluetoothControl',
            method : 'devices'
        };

        return this.api.req(null, _rpc).then( devices => {
            // bail out if the plugin returns nothing
            if (devices === undefined)
                return;

            this._devices = []
            if (devices && devices.length)
                devices.forEach( (address) => { this._devices.push({ address : address }) });

            return this._devices
        });
    }

    device(address) {
        const _rpc = {
            plugin: 'BluetoothControl',
            method: 'device@' + address
        }

        return this.api.req(null, _rpc)
    }

    scanComplete() {
        this.scanning = false
        this.renderScanStatus()
        this.update()
        this.updateStatus('Scan complete');
    }

    /* ----------------------------- RENDERING ------------------------------*/

    renderScanStatus () {
        const _rest = {
            method  : 'GET',
            path    : this.callsign
        };

        // unfortunately not supported on JSON RPC yet
        return this.api.req(_rest, null).then( results => {
            this.scanningStatus.innerHTML = results.scanning === true ? 'ON' : 'OFF';
        });
    }

    updateDeviceList() {
        this.deviceList.innerHTML = '';

        if (this._devices && this._devices.length){
            this._devices.forEach( (d) => {
                var newDeviceChild = this.deviceList.appendChild(document.createElement("option"));
                newDeviceChild.innerHTML = d.address
            });

            this.renderDevice()
        }
    }

    renderDevice() {
        let idx = this.deviceList.selectedIndex;
        if (idx === -1 || this._devices.length === 0)
            return


        let address = this._devices[idx].address
        this.device(address).then( (data)=>{
            if (data)
                this._devices[idx] = { address, ...data }

            this.nameEl.innerHTML = this._devices[idx].name
            this.typeEl.innerHTML = this._devices[idx].type
            this.connectedEl.innerHTML = this._devices[idx].connected
            this.pairedEl.innerHTML = this._devices[idx].paired
        })
    }

    updateStatus(message, error = false) {
        window.clearTimeout(this.statusMessageTimer);
        this.statusMessages.innerHTML = message;

        if (error)
            this.statusMessages.style = 'color: red'
        else
            this.statusMessages.style = ''

        // clear after 5s
        this.statusMessageTimer = setTimeout(this.updateStatus, 5000, '');
    }

    update() {
        this.renderScanStatus()
        this.devices().then( () => {
            this.updateDeviceList()
        })
    }

    /* ----------------------------- BUTTONS ------------------------------*/

    scanForDevices() {
        this.updateStatus(`Start scanning`);
        this.scanning = true
        this.renderScanStatus()

        const _rpc = {
            plugin : 'BluetoothControl',
            method : 'scan',
            params : {
                type : this.btLowEnergyButton.checked ? 'LowEnergy' : 'Regular',
                timeout: 10
            }
        };

        this.api.req(null, _rpc).catch( e => {
            if (e.message)
            this.updateStatus(`Error: ${e.message}`);
        })
    }

    pairDevice() {
        var idx = this.deviceList.selectedIndex;
        this.updateStatus(`Pairing to ${this._devices[idx].name}`);

        const _rpc = {
            plugin : this.callsign,
            method : 'pair',
            params : {
                "address" : this._devices[idx].address
            }
        };

        this.api.req(null, _rpc).catch( e => {
            if (e.message)
                this.updateStatus(`Error: ${e.message}`, true);
        })
    }

    unpairDevice() {
        var idx = this.deviceList.selectedIndex;
        this.updateStatus(`Unpairing ${this._devices[idx].name}`);

        const _rpc = {
            plugin : this.callsign,
            method : 'unpair',
            params : {
                "address" : this._devices[idx].address
            }
        };

        this.api.req(null, _rpc).catch( e => {
            if (e.message)
                this.updateStatus(`Error: ${e.message}`, true);
        })
    }

    connect() {
        var idx = this.deviceList.selectedIndex;
        this.updateStatus(`Connecting to ${this._devices[idx].name}`);

        const _rpc = {
            plugin : this.callsign,
            method : 'connect',
            params : {
                "address" : this._devices[idx].address
            }
        };

        this.api.req(null, _rpc).catch( e => {
            if (e.message)
                this.updateStatus(`Error: ${e.message}`, true);
        })
    }

    disconnect() {
        var idx = this.deviceList.selectedIndex;
        this.updateStatus(`Disconnecting from ${this._devices[idx].name}`);

        const _rpc = {
            plugin : this.callsign,
            method : 'disconnect',
            params : {
                "address" : this._devices[idx].address
            }
        };

        this.api.req(null, _rpc).catch( e => {
            if (e.message)
                this.updateStatus(`Error: ${e.message}`, true);
        })
    }

    assign() {
        var idx = this.deviceList.selectedIndex;
        this.updateStatus(`Assigning ${this._devices[idx].name}`);

        const _rpc = {
            plugin : 'BluetoothRemoteControl',
            method : 'assign',
            params : {
                "address" : this._devices[idx].address
            }
        };

        this.api.req(null, _rpc)
    }

    revoke() {
        var idx = this.deviceList.selectedIndex;
        this.updateStatus(`Revoking ${this._devices[idx].name}`);

        const _rpc = {
            plugin : 'BluetoothRemoteControl',
            method : 'revoke',
            params : {
                "address" : this._devices[idx].address
            }
        };

        this.api.req(null, _rpc).catch( e => {
            if (e.message)
                this.updateStatus(`Error: ${e.message}`, true);
        })
    }

    close() {
        clearInterval(this.statusMessageTimer);

        if (this.scanListener && typeof this.scanListener.dispose === 'function') this.scanListener.dispose();
        if (this.scanListener && typeof this.scanListener.dispose === 'function') this.deviceStateListener.dispose();
    }
}

export default BluetoothControl;
