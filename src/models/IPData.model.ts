export type IPData = {
    ip: string;
    location: {
      city: string;
      region: string;
      country: string;
      continent: string;
      region_code: string;
      country_code: string;
      continent_code: string;
      latitude: string;
      longitude: string;
      time_zone: string;
      locale_code: string;
      metro_code: string;
      is_in_european_union: string;
    };
    security: {
      vpn: boolean;
      tor: boolean;
      relay: boolean;
      proxy: boolean;
    };
    network: {
      network: string;
      autonomous_system_number: string;
      autonomous_system_organization: string;
    };
  };