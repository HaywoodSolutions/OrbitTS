"use strict";

import TLE from './TLE';
import * as Util from './Utils';

const ck2: number = 5.413080e-4;
const ck4: number = 0.62098875e-6;
const e6a: number = 1.0e-6;
const qoms2t: number = 1.88027916e-9;
const s: number = 1.01222928;
const xj3: number = -0.253881e-5;
const xke: number = 0.743669161e-1;
const xkmper: number = 6378.137; // Earth's radius WGS-84
const xflat: number = 0.00335281066; // WGS-84 flattening
const xminpday: number = 1440.0;
const ae: number = 1.0;
const pi: number = Math.PI;
const pio2: number = pi / 2;
const twopi: number = 2 * pi;
const x3pio2: number = 3 * pio2;

const torad: number = pi / 180;
const tothrd: number = 0.66666667;

export default class Orbit {
  private tle: TLE;
  private date: Date | null;

  private xinc: number;
  private xnodeo: number;
  private eo: number;
  private omegao: number;
  private xmo: number;
  private xno: number;
  private bstar: number;

  private isimp: number;
  private c5: number;
  private xmdot: number;

  private omgdot: number;
  private xnodot: number;
  private omgcof: number;
  private xmcof: number;
  private xnodcf: number;
  private t2cof: number;
  private xlcof: number;
  private aycof: number;
  private delmo: number;
  private sinmo: number;
  private x7thm1: number;

  private t3cof: number = 0;
  private t4cof: number = 0;
  private t5cof: number = 0;

  private aodp: number;
  private c1: number;
  private c4: number;
  private cosio: number;
  private d2: number;
  private d3: number;
  private d4: number;
  private eta: number;
  private sinio: number;
  private x3thm1: number;
  private x1mth2: number;
  private xnodp: number;

  private x?: number;
  private y?: number;
  private z?: number;
  private xdot?: number;
  private ydot?: number;
  private zdot?: number;

  private period: number = 0;
  private velocity: number = 0;
  private altitude: number = 0;

  private latitude: number = 0;
  private longitude: number = 0;

  constructor(tleObj: TLE) {
    this.tle = tleObj;
    this.date = null;

    this.xinc = this.tle.inclination * torad;
    this.xnodeo = this.tle.right_ascension * torad;
    this.eo = this.tle.eccentricity;
    this.omegao = this.tle.argument_of_perigee * torad;
    this.xmo = this.tle.mean_anomaly * torad;
    this.xno = this.tle.mean_motion * twopi / 1440.0;
    this.bstar = this.tle.bstar;

    // recover orignal mean motion (xnodp) and semimajor axis (adop)
    let a1 = Math.pow(xke / this.xno, tothrd);
    let cosio = Math.cos(this.xinc);
    let theta2 = cosio * cosio;
    let x3thm1 = 3.0 * theta2 - 1;
    let eosq = this.eo * this.eo;
    let betao2 = 1.0 - eosq;
    let betao = Math.sqrt(betao2);
    let del1 = 1.5 * ck2 * x3thm1 / (a1 * a1 * betao * betao2);
    let ao = a1 * (1 - del1 * ((1.0 / 3.0) + del1 * (1.0 + (134.0 / 81.0) * del1)));
    let delo = 1.5 * ck2 * x3thm1 / (ao * ao * betao * betao2);
    let xnodp = this.xno / (1.0 + delo); //original_mean_motion
    let aodp = ao / (1.0 - delo); //semi_major_axis

    // initialization
    this.isimp = ((aodp * (1.0 - this.eo) / ae) < (220.0 / xkmper + ae)) ? 1 : 0;

    let s4 = s;
    let qoms24 = qoms2t;
    let perige = (aodp * (1.0 - this.eo) - ae) * xkmper;
    if (perige < 156.0) {
      s4 = perige - 78.0;
      if (perige <= 98.0) {
        s4 = 20.0;
      } else {
        qoms24 = Math.pow(((120.0 - s4) * ae / xkmper), 4);
        s4 = s4 / xkmper + ae;
      }
    }
    let pinvsq = 1.0 / (aodp * aodp * betao2 * betao2);
    let tsi = 1.0 / (aodp - s4);
    let eta = aodp * this.eo * tsi;
    let etasq = eta * eta;
    let eeta = this.eo * eta;
    let psisq = Math.abs(1.0 - etasq);
    let coef = qoms24 * Math.pow(tsi, 4);
    let coef1 = coef / Math.pow(psisq, 3.5);

    let c2 = coef1 * xnodp * (aodp * (1.0 + 1.5 * etasq + eeta * (4.0 + etasq)) + 0.75 * ck2 * tsi / psisq * x3thm1 * (8.0 + 3.0 * etasq * (8.0 + etasq)));
    let c1 = this.bstar * c2;
    let sinio = Math.sin(this.xinc);
    let a3ovk2 = -xj3 / ck2 * Math.pow(ae, 3);
    let c3 = coef * tsi * a3ovk2 * xnodp * ae * sinio / this.eo;
    let x1mth2 = 1.0 - theta2;
    let c4 = 2.0 * xnodp * coef1 * aodp * betao2 * (eta * (2.0 + 0.5 * etasq) + this.eo * (0.5 + 2.0 * etasq) - 2.0 * ck2 * tsi / (aodp * psisq) * (-3.0 * x3thm1 * (1.0 - 2.0 * eeta + etasq * (1.5 - 0.5 * eeta)) + 0.75 * x1mth2 * (2.0 * etasq - eeta * (1.0 + etasq)) * Math.cos((2.0 * this.omegao))));
    this.c5 = 2.0 * coef1 * aodp * betao2 * (1.0 + 2.75 * (etasq + eeta) + eeta * etasq);

    let theta4 = theta2 * theta2;
    let temp1 = 3.0 * ck2 * pinvsq * xnodp;
    let temp2 = temp1 * ck2 * pinvsq;
    let temp3 = 1.25 * ck4 * pinvsq * pinvsq * xnodp;
    this.xmdot = xnodp + 0.5 * temp1 * betao * x3thm1 + 0.0625 * temp2 * betao * (13.0 - 78.0 * theta2 + 137.0 * theta4);

    let x1m5th = 1.0 - 5.0 * theta2;
    this.omgdot = -0.5 * temp1 * x1m5th + 0.0625 * temp2 * (7.0 - 114.0 * theta2 + 395.0 * theta4) + temp3 * (3.0 - 36.0 * theta2 + 49.0 * theta4);
    let xhdot1 = -temp1 * cosio;
    this.xnodot = xhdot1 + (0.5 * temp2 * (4.0 - 19.0 * theta2) + 2.0 * temp3 * (3.0 - 7.0 * theta2)) * cosio;
    this.omgcof = this.bstar * c3 * Math.cos(this.omegao);
    this.xmcof = -tothrd * coef * this.bstar * ae / eeta;
    this.xnodcf = 3.5 * betao2 * xhdot1 * c1;
    this.t2cof = 1.5 * c1;
    this.xlcof = 0.125 * a3ovk2 * sinio * (3.0 + 5.0 * cosio) / (1.0 + cosio);
    this.aycof = 0.25 * a3ovk2 * sinio;
    this.delmo = Math.pow((1.0 + eta * Math.cos(this.xmo)), 3);
    this.sinmo = Math.sin(this.xmo);
    this.x7thm1 = 7.0 * theta2 - 1.0;

    let d2, d3, d4;
    if (this.isimp != 1) {
      let c1sq = c1 * c1;
      d2 = 4.0 * aodp * tsi * c1sq;
      let temp = d2 * tsi * c1 / 3.0;
      d3 = (17.0 * aodp + s4) * temp;
      d4 = 0.5 * temp * aodp * tsi * (221.0 * aodp + 31.0 * s4) * c1;
      this.t3cof = d2 + 2.0 * c1sq;
      this.t4cof = 0.25 * (3.0 * d3 + c1 * (12.0 * d2 + 10.0 * c1sq));
      this.t5cof = 0.2 * (3.0 * d4 + 12.0 * c1 * d3 + 6.0 * d2 * d2 + 15.0 * c1sq * (2.0 * d2 + c1sq));
    }

    // set variables that are needed in the calculate() routine
    this.aodp = aodp;
    this.c1 = c1;
    this.c4 = c4;
    this.cosio = cosio;
    this.d2 = d2 || 0;
    this.d3 = d3 || 0;
    this.d4 = d4 || 0;
    this.eta = eta;
    this.sinio = sinio;
    this.x3thm1 = x3thm1;
    this.x1mth2 = x1mth2;
    this.xnodp = xnodp;
  }

  clone(): Orbit {
    return new Orbit(this.tle);
  }

  /**
   *calculates position and velocity vectors based date set on the Orbit object
  */
  propagate() {
    let date = (this.date === null) ? new Date() : this.date;
    let tsince = this.tle.dtime(date);

    // update for secular gravity and atmospheric drag

    let xmdf = this.xmo + this.xmdot * tsince;
    let omgadf = this.omegao + this.omgdot * tsince;
    let xnoddf = this.xnodeo + this.xnodot * tsince;
    let omega = omgadf;
    let xmp = xmdf;
    let tsq = tsince * tsince;
    let xnode = xnoddf + this.xnodcf * tsq;
    let tempa = 1.0 - this.c1 * tsince;
    let tempe = this.bstar * this.c4 * tsince;
    let templ = this.t2cof * tsq;

    let temp;
    if (this.isimp != 1) {
      let delomg = this.omgcof * tsince;
      let delm = this.xmcof * (Math.pow((1.0 + this.eta * Math.cos(xmdf)), 3) - this.delmo);
      temp = delomg + delm;
      xmp = xmdf + temp;
      omega = omgadf - temp;
      let tcube = tsq * tsince;
      let tfour = tsince * tcube;
      tempa = tempa - this.d2 * tsq - this.d3 * tcube - this.d4 * tfour;
      tempe = tempe + this.bstar * this.c5 * (Math.sin(xmp) - this.sinmo);
      templ = templ + this.t3cof * tcube + tfour * (this.t4cof + tsince * this.t5cof);
    }
    let a = this.aodp * tempa * tempa;
    let e = this.eo - tempe;
    let xl = xmp + omega + xnode + this.xnodp * templ;
    let beta = Math.sqrt(1.0 - e * e);
    let xn = xke / Math.pow(a, 1.5);

    // long period periodics
    let axn = e * Math.cos(omega);
    temp = 1.0 / (a * beta * beta);
    let xll = temp * this.xlcof * axn;
    let aynl = temp * this.aycof;
    let xlt = xl + xll;
    let ayn = e * Math.sin(omega) + aynl;

    // solve keplers equation

    let capu = (xlt - xnode) % (2.0 * Math.PI);
    let temp2 = capu;
    let i;
    let temp3 = 0, temp4 = 0, temp5 = 0, temp6 = 0;
    let sinepw = 0, cosepw = 0;
    for (i = 1; i <= 10; i++) {
      sinepw = Math.sin(temp2);
      cosepw = Math.cos(temp2);
      temp3 = axn * sinepw;
      temp4 = ayn * cosepw;
      temp5 = axn * cosepw;
      temp6 = ayn * sinepw;
      let epw = (capu - temp4 + temp3 - temp2) / (1.0 - temp5 - temp6) + temp2;
      if (Math.abs(epw - temp2) <= e6a) {
        break;
      }
      temp2 = epw;
    }
    // short period preliminary quantities

    let ecose = temp5 + temp6;
    let esine = temp3 - temp4;
    let elsq = axn * axn + ayn * ayn;
    temp = 1.0 - elsq;
    let pl = a * temp;
    let r = a * (1.0 - ecose);
    let temp1 = 1.0 / r;
    let rdot = xke * Math.sqrt(a) * esine * temp1;
    let rfdot = xke * Math.sqrt(pl) * temp1;
    temp2 = a * temp1;
    let betal = Math.sqrt(temp);
    temp3 = 1.0 / (1.0 + betal);
    let cosu = temp2 * (cosepw - axn + ayn * esine * temp3);
    let sinu = temp2 * (sinepw - ayn - axn * esine * temp3);
    let u = Math.atan2(sinu, cosu);
    u += (u < 0) ? 2 * Math.PI : 0;
    let sin2u = 2.0 * sinu * cosu;
    let cos2u = 2.0 * cosu * cosu - 1.0;
    temp = 1.0 / pl;
    temp1 = ck2 * temp;
    temp2 = temp1 * temp;

    // update for short periodics

    let rk = r * (1.0 - 1.5 * temp2 * betal * this.x3thm1) + 0.5 * temp1 * this.x1mth2 * cos2u;
    let uk = u - 0.25 * temp2 * this.x7thm1 * sin2u;
    let xnodek = xnode + 1.5 * temp2 * this.cosio * sin2u;
    let xinck = this.xinc + 1.5 * temp2 * this.cosio * this.sinio * cos2u;
    let rdotk = rdot - xn * temp1 * this.x1mth2 * sin2u;
    let rfdotk = rfdot + xn * temp1 * (this.x1mth2 * cos2u + 1.5 * this.x3thm1);

    // orientation vectors

    let sinuk = Math.sin(uk);
    let cosuk = Math.cos(uk);
    let sinik = Math.sin(xinck);
    let cosik = Math.cos(xinck);
    let sinnok = Math.sin(xnodek);
    let cosnok = Math.cos(xnodek);
    let xmx = -sinnok * cosik;
    let xmy = cosnok * cosik;
    let ux = xmx * sinuk + cosnok * cosuk;
    let uy = xmy * sinuk + sinnok * cosuk;
    let uz = sinik * sinuk;
    let vx = xmx * cosuk - cosnok * sinuk;
    let vy = xmy * cosuk - sinnok * sinuk;
    let vz = sinik * cosuk;

    // position and velocity in km
    this.x = (rk * ux) * xkmper;
    this.y = (rk * uy) * xkmper;
    this.z = (rk * uz) * xkmper;
    this.xdot = (rdotk * ux + rfdotk * vx) * xkmper;
    this.ydot = (rdotk * uy + rfdotk * vy) * xkmper;
    this.zdot = (rdotk * uz + rfdotk * vz) * xkmper;

    /**
     * orbit period in seconds
     * @type {float}
     * @readonly
     */
    this.period = twopi * Math.sqrt(Math.pow(this.aodp * xkmper, 3) / 398600.4);

    /**
     * velocity in km per second
     * @type {float}
     * @readonly
     */
    this.velocity = Math.sqrt(this.xdot * this.xdot + this.ydot * this.ydot + this.zdot * this.zdot) / 60; // kmps

    // lat, lon and altitude
    // based on http://www.celestrak.com/columns/v02n03/

    a = 6378.137;
    let b = 6356.7523142;
    let R = Math.sqrt(this.x * this.x + this.y * this.y);
    let f = (a - b) / a;
    let gmst = Util.gmst(date);

    let e2 = ((2 * f) - (f * f));
    let longitude = Math.atan2(this.y, this.x) - gmst;
    let latitude = Math.atan2(this.z, R);

    let C = 0;
    let iterations = 20;
    while (iterations--) {
      C = 1 / Math.sqrt(1 - e2 * (Math.sin(latitude) * Math.sin(latitude)));
      latitude = Math.atan2(this.z + (a * C * e2 * Math.sin(latitude)), R);
    }

    /**
     * Altitude in kms
     * @type {float}
     * @readonly
     */
    this.altitude = (R / Math.cos(latitude)) - (a * C);

    // convert from radii to degrees
    longitude = (longitude / torad) % 360;
    if (longitude > 180) longitude = 360 - longitude;
    else if (longitude < -180) longitude = 360 + longitude;
    latitude = (latitude / torad);

    /**
     * latitude in degrees
     * @type {float}
     * @readonly
     */
    this.latitude = latitude;

    /**
     * longtitude in degrees
     * @type {float}
     * @readonly
     */
    this.longitude = longitude;
  };

  /**
   * Change the datetime, or null for to use current
   * @param {Date} date
   */
  setDate(date: Date): void {
    this.date = date;
  };

  /**
   * get position
   * @returns {float[]} [latitude, longitude]
   */
  getPosition(): [number, number] {
    return [this.latitude, this.longitude];
  }

  /**
   * get position in LatLng
   * @returns {latitude: number, longitude: number}
   */
  getLatLng(): { latitude: number, longitude: number } {
    return { latitude: this.latitude, longitude: this.longitude };
  }

  /**
   * get altitude in km
   * @returns {float}
   */
  getAltitude(): number {
    return this.altitude;
  }

  /**
   * get velocity in km per seconds
   * @returns {float}
   */
  getVelocity(): number {
    return this.velocity;
  }

  /**
   *get period in seconds
  * @returns {float}
  */
  getPeriod(): number {
    return this.period;
  }

  getDate(): Date {
    return this.date == null ? new Date() : this.date;
  }

  toJSON() {
    return {
      position: this.getPosition(),
      altitude: this.getAltitude(),
      velocity: this.getVelocity(),
      period: this.getPeriod(),
      date: this.getDate(),
    }
  }
}