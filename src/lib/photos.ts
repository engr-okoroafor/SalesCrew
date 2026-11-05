// Rise & Eat services board (supplied artwork). Local copies in /public/brand.
import { RISE_CATALOG, RISE_FLYER, RISE_LOGO } from "./brand";
export const HERO = "/brand/catalog/cakes.jpg";
export const LOGO = RISE_LOGO;
export const FLYER = RISE_FLYER;
export const SERVICES = RISE_CATALOG.map((p) => ({ title: p.name, desc: p.desc, img: p.img, tip: p.tip }));
export const GALLERY = [RISE_FLYER, "/brand/catalog/catering.jpg", "/brand/catalog/chops.jpg", "/brand/catalog/pastries.jpg", "/brand/catalog/juice.jpg", "/brand/catalog/events.jpg"];
