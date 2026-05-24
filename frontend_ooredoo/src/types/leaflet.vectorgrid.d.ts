declare module 'leaflet.vectorgrid' {
  import * as L from 'leaflet';
  namespace vectorgrid {
    function slicer(geojson: any, options?: any): any;
    function protobuf(url: string, options?: any): any;
  }
  function vectorgrid(options?: any): any;
}
