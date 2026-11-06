/** Browsers retain empty slots after controllers disconnect or reconnect. */
export function connectedGamepad():Gamepad|undefined{
  return [...(navigator.getGamepads?.()??[])].find(p=>p?.connected)??undefined;
}
