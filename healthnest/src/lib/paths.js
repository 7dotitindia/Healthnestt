// Staff-only areas have their own shell, so the public header, footer and notices are hidden there.
export const isStaffPath = (pathname) => /^\/(admin|freelancer|staff)(\/|$)/.test(pathname || "");

// Sign-in and sign-up pages carry their own small top bar, so the public header and footer are hidden there too.
export const isAuthPath = (pathname) => /^\/(login|signup)(\/|$)/.test(pathname || "");
