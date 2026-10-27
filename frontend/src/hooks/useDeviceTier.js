import { useEffect } from 'react';

// Adds a 'low-tier' class to the <html> element if the device is determined to be low-end.
// We use deviceMemory (RAM <= 4GB) or hardwareConcurrency (CPU cores <= 4) as heuristics.
// In low-tier mode, CSS can disable expensive effects like backdrop-filter blurs.
export default function useDeviceTier() {
  useEffect(() => {
    let isLowTier = false;

    // Check device memory (RAM in GB) if available
    if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
      isLowTier = true;
    }
    
    // Check logical processors if available (often 4 or less on older/cheaper phones)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      isLowTier = true;
    }

    // Accessibility preferences are handled independently in CSS and motion.
    // Reduced motion does not imply reduced transparency or slower hardware.

    if (isLowTier) {
      document.documentElement.classList.add('low-tier');
    } else {
      document.documentElement.classList.remove('low-tier');
    }
  }, []);
}
