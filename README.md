# OrbitsTS

A small library to calculate satellite orbits from two-line elements.

## Example usage

```typescript
import TLE from './TLE';
import Satellite from './Satellite';

const tle = new TLE("NOAA 14", "1 23455U 94089A   97320.90946019  .00000140  00000-0  10191-3 0  2621", "2 23455  99.0090 272.6745 0008546 223.1686 136.8816 14.11711747148495");
const sat = new Satellite(tle, 0.25);
```

## Library based on
* [Orbits.js](https://github.com/rossengeorgiev/orbits-js)
*By rossengeorgiev*
* [Models for Propagation of NORAD Element Sets](http://www.celestrak.com/NORAD/documentation/spacetrk.pdf)
*By Felix R. Hoots and Ronald L. Roehrichm, December 1980*
* [Orbital Coordinate Systems, Part III](http://www.celestrak.com/columns/v02n03/)
*By Dr. T.S. Kelso*