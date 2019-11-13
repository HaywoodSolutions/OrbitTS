"use strict";
import TLE from './TLE';
import Orbit from './Orbit';
import { getDistanceToHorizon, halfEarthCircumference, calculateLatLngOfSun, distanceBetween } from './Utils';

/**
 *Initializes a Satellite object (requires Google Maps API3)
 * @class
 * @param   {orbits.SatelliteOptions} options - an obj with options, see orbits.SatelliteOptions
 */
export default class Satellite {
  private tle: TLE;
  private pathLength: number = .5;
  private date: Date = new Date();
  private orbit: Orbit;
  //private horizonRadius: number;
  private title: string;  
  private path: {latitude: number, longitude: number}[] = [];
  //public shadowPolylines: {latitude: number, longitude: number}[];
  private position: {latitude: number, longitude: number}|null = null;


  constructor(tle: TLE, pathLength: number = 0.5) {
    this.tle = tle;
    this.orbit = new Orbit(tle);
    this.title = tle.name;
    this.pathLength = pathLength;
    this.refresh();
  }

  getTitle(): string {
    return this.title;
  }

  getPath(): {latitude: number, longitude: number}[] {
    return this.path;
  }

  getPosition(): {latitude: number, longitude: number}|null {
    return this.position;
  }

  /**
   *Recalculates the position and updates the markers
  */
  refresh() {
    if (this.orbit === null) return;

    this.orbit.setDate(this.date);
    this.orbit.propagate();
    this.position = this.orbit.getLatLng();
    //let alt = this.orbit.getAltitude() * 1000;
    //this.horizonRadius = getDistanceToHorizon(alt);
    this._updatePoly();
  };

  /**
   *Redraw path
  */
  refresh_path() {
    if (this.pathLength >= 1.0/180) this._updatePoly();
  };

  _updatePoly() {
    let dt = (this.orbit.getPeriod() * 1000) / 180;
    let date = (this.date) ? this.date : new Date();
    this.path = [];
    //this.shadowPolylines = [];
    let night = false;
    let curr_path: {latitude: number, longitude: number}[] = [];
    //let curr_poly = null;
    let curr_date = null;
    let curr_night = null;

    let i = 0;
    let jj = (180 * this.pathLength) + 1;
    for (; i <= jj; i++) {
      curr_date = new Date(date.getTime() + dt*i);
      this.orbit.setDate(curr_date);
      this.orbit.propagate();
      let pos = this.orbit.getLatLng();
      this.path.push(pos);

      let dist = distanceBetween(calculateLatLngOfSun(curr_date), pos);
      curr_night = dist > halfEarthCircumference + getDistanceToHorizon(this.orbit.getAltitude() * 1000);

      if (night === true && curr_night === true) {
        curr_path.push(pos);
      } else if (night === true && curr_night === false) {
        //curr_poly = [...curr_path];
      } else if (night === false && curr_night === true) {
        //curr_poly = [];
        //this.shadowPolylines.push(curr_poly);
        curr_path = [pos];
      }
      night = curr_night;
    }

    //if (night) curr_poly = [...curr_path];
    this.orbit.setDate(this.date);
  };

  /**
   * Set a Date instance or null to use the current datetime.
   * @param   {Date} date - An instance of Date
   */
  setDate(date: Date) {
    this.date = date;
    this.refresh();
  };

  toJSON() {
    this.refresh();
    return {
      //orbit: this.orbit.toJSON(),
      date: this.date,
      title: this.title,
      position: this.position,
      path: this.path
    };
  }
}