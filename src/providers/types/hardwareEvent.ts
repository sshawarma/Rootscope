export interface DeviceUserInterface {
    type: string;
    minor: number;
    major: number;
}

export interface Device {
    device_name: string;
    device_kernel_location: string;
    device_user_access_point: string;
    device_subsystem: string;
    device_user_interface: DeviceUserInterface;
}

export interface DaemonHardwareEvent {
    event_id: number;
    created_at: number;
    action: number;
    device: Device;
}
