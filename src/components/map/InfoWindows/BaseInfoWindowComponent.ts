// src/components/map/InfoWindows/BaseInfoWindowComponent.ts
export class BaseInfoWindowComponent {
  protected infoWindow: google.maps.InfoWindow;
  protected map: google.maps.Map;
  protected position: google.maps.LatLngLiteral;

  constructor(map: google.maps.Map, position: google.maps.LatLngLiteral) {
    this.map = map;
    this.position = position;
    this.infoWindow = new google.maps.InfoWindow({
      pixelOffset: new google.maps.Size(0, -30)
    });
  }

  setContentAndPosition(content: string) {
    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(this.position);
  }

  addDomReadyListener(callback: () => void) {
    return google.maps.event.addListenerOnce(this.infoWindow, 'domready', callback);
  }

  addCloseListener(callback: () => void) {
    return google.maps.event.addListener(this.infoWindow, 'closeclick', callback);
  }

  open() {
    this.infoWindow.open(this.map);
  }

  close() {
    this.infoWindow.close();
  }

  // Add method to update position
  updatePosition(position: google.maps.LatLngLiteral) {
    this.position = position;
    this.infoWindow.setPosition(position);
  }
}