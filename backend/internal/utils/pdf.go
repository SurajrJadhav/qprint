package utils

import (
	"fmt"

	"github.com/pdfcpu/pdfcpu/pkg/api"
)

// CountPDFPages returns the number of pages in a PDF file
func CountPDFPages(filePath string) (int, error) {
	pageCount, err := api.PageCountFile(filePath)
	if err != nil {
		return 0, fmt.Errorf("failed to count PDF pages: %w", err)
	}
	return pageCount, nil
}

// CalculateCost calculates the total cost based on pages and copies
// Cost formula: Pages × Copies × ₹1 per page
func CalculateCost(pages, copies int) float64 {
	return float64(pages * copies)
}
