// Staff-only areas have their own shell, so the public header, footer and notices are hidden there.
export const isStaffPath = (pathname) => /^\/(admin|freelancer|staff)(\/|$)/.test(pathname || "");
