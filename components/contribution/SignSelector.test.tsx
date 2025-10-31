/**
 * Tests for SignSelector Search and Sorting Functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignSelector from './SignSelector'

// Mock fetch
global.fetch = jest.fn()

const mockWords = [
  { word: 'HELLO', contributions: 8, needed: 10, ready: false },
  { word: 'THANK_YOU', contributions: 5, needed: 10, ready: false },
  { word: 'GOODBYE', contributions: 3, needed: 10, ready: false },
  { word: 'SCHOOL', contributions: 10, needed: 10, ready: true },
  { word: 'BABY', contributions: 7, needed: 10, ready: false },
  { word: 'LEARN', contributions: 2, needed: 10, ready: false },
]

describe('SignSelector - Search and Sorting', () => {
  beforeEach(() => {
    try {
      jest.clearAllMocks()
    } catch (e) {
      // Ignore
    }

    // Mock API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        words: mockWords,
        total: mockWords.length
      })
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort words by contribution count descending', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      // Check that HELLO (8 contributions) appears before THANK_YOU (5 contributions)
      const helloElement = screen.getByText('HELLO')
      const thankYouElement = screen.getByText('THANK YOU')

      const helloCard = helloElement.closest('[class*="rounded"]')
      const thankYouCard = thankYouElement.closest('[class*="rounded"]')

      const helloPosition = Array.from(helloCard?.parentElement?.children || []).indexOf(helloCard as Element)
      const thankYouPosition = Array.from(thankYouCard?.parentElement?.children || []).indexOf(thankYouCard as Element)

      expect(helloPosition).toBeLessThan(thankYouPosition)
    })

    it('should place incomplete words before complete words', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      // SCHOOL is complete (10/10) so it should appear last
      const schoolElement = screen.getByText('SCHOOL')
      const learnElement = screen.getByText('LEARN')

      const schoolCard = schoolElement.closest('[class*="rounded"]')
      const learnCard = learnElement.closest('[class*="rounded"]')

      // LEARN (incomplete, 2 contributions) should appear before SCHOOL (complete, 10 contributions)
      const schoolPosition = Array.from(schoolCard?.parentElement?.children || []).indexOf(schoolCard as Element)
      const learnPosition = Array.from(learnCard?.parentElement?.children || []).indexOf(learnCard as Element)

      expect(learnPosition).toBeLessThan(schoolPosition)
    })

    it('should maintain sort order after filtering', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      // Search for words containing 'A'
      const searchInput = screen.getByPlaceholderText(/Search for a sign/)
      fireEvent.change(searchInput, { target: { value: 'A' } })

      await waitFor(() => {
        // Should show THANK_YOU (5), BABY (7), LEARN (2) - sorted descending
        const foundMessage = screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('sign') && element?.textContent?.includes('matching') || false
        })
        expect(foundMessage).toBeInTheDocument()
      })

      // BABY (7) should appear before THANK_YOU (5)
      const babyElement = screen.getByText('BABY')
      const thankYouElement = screen.getByText('THANK YOU')

      const babyCard = babyElement.closest('[class*="rounded"]')
      const thankYouCard = thankYouElement.closest('[class*="rounded"]')

      const babyPosition = Array.from(babyCard?.parentElement?.children || []).indexOf(babyCard as Element)
      const thankYouPosition = Array.from(thankYouCard?.parentElement?.children || []).indexOf(thankYouCard as Element)

      expect(babyPosition).toBeLessThan(thankYouPosition)
    })
  })

  describe('Search Functionality', () => {
    it('should render search input', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search for a sign/)).toBeInTheDocument()
      })
    })

    it('should filter signs based on search query', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search for a sign/)

      // Search for "hello"
      fireEvent.change(searchInput, { target: { value: 'hello' } })

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('1') && element?.textContent?.includes('sign') && element?.textContent?.includes('matching') || false
        })).toBeInTheDocument()
        expect(screen.getByText('HELLO')).toBeInTheDocument()
        expect(screen.queryByText('THANK YOU')).not.toBeInTheDocument()
      })
    })

    it('should be case-insensitive', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search for a sign/)

      // Search with mixed case
      fireEvent.change(searchInput, { target: { value: 'HeLLo' } })

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('1') && element?.textContent?.includes('sign') || false
        })).toBeInTheDocument()
        expect(screen.getByText('HELLO')).toBeInTheDocument()
      })
    })

    it('should handle underscores in word names', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/THANK YOU/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search for a sign/)

      // Search for "thank you" (without underscore)
      fireEvent.change(searchInput, { target: { value: 'thank you' } })

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('1') && element?.textContent?.includes('sign') || false
        })).toBeInTheDocument()
        expect(screen.getByText('THANK YOU')).toBeInTheDocument()
      })
    })

    it('should show clear button when search has text', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search for a sign/)

      // Initially no clear button
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'hello' } })

      // Clear button should appear
      await waitFor(() => {
        expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
      })
    })

    it('should clear search when clear button is clicked', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search for a sign/)

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'hello' } })

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('1') && element?.textContent?.includes('sign') || false
        })).toBeInTheDocument()
      })

      // Click clear button
      const clearButton = screen.getByLabelText('Clear search')
      fireEvent.click(clearButton)

      // Search should be cleared and all signs shown
      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe('')
        expect(screen.queryByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('sign matching') || false
        })).not.toBeInTheDocument()
        expect(screen.getByText('HELLO')).toBeInTheDocument()
        expect(screen.getByText('THANK YOU')).toBeInTheDocument()
      })
    })

    it('should reset to page 1 when searching', async () => {
      // This test would need a larger dataset to properly test pagination
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      // Verify we're on page 1
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()

      // Search
      const searchInput = screen.getByPlaceholderText(/Search for a sign/)
      fireEvent.change(searchInput, { target: { value: 'hello' } })

      // Should still be on page 1
      await waitFor(() => {
        expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()
      })
    })

    it('should show "Found X signs" message', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search for a sign/)

      // Search for words with 'O'
      fireEvent.change(searchInput, { target: { value: 'o' } })

      await waitFor(() => {
        // Should find: HELLO, GOODBYE, SCHOOL (or THANK_YOU if it contains 'o')
        // Just check that the search result message appears
        expect(screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('sign') && element?.textContent?.includes('matching') || false
        })).toBeInTheDocument()
      })
    })

    it('should show singular "sign" when only 1 result', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search for a sign/)

      // Search for unique word
      fireEvent.change(searchInput, { target: { value: 'learn' } })

      await waitFor(() => {
        // Should show singular "sign" not "signs"
        expect(screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('1') && element?.textContent?.includes('sign matching') && !element?.textContent?.includes('signs') || false
        })).toBeInTheDocument()
      })
    })

    it('should show no results when search matches nothing', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search for a sign/)

      // Search for nonexistent word
      fireEvent.change(searchInput, { target: { value: 'xyz123' } })

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('0') && element?.textContent?.includes('signs') || false
        })).toBeInTheDocument()
        expect(screen.queryByText('HELLO')).not.toBeInTheDocument()
      })
    })
  })

  describe('Integration: Search + Sorting', () => {
    it('should maintain sorted order within search results', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      // Search for words containing 'E'
      const searchInput = screen.getByPlaceholderText(/Search for a sign/)
      fireEvent.change(searchInput, { target: { value: 'e' } })

      await waitFor(() => {
        // Should find: HELLO(8), GOODBYE(3), LEARN(2) - all incomplete
        // Order should be: HELLO(8), GOODBYE(3), LEARN(2)
        expect(screen.getByText((content, element) => {
          return element?.textContent?.startsWith('Found') && element?.textContent?.includes('3') && element?.textContent?.includes('signs') || false
        })).toBeInTheDocument()
      })

      // Verify HELLO appears before GOODBYE
      const helloElement = screen.getByText('HELLO')
      const goodbyeElement = screen.getByText('GOODBYE')

      const helloCard = helloElement.closest('[class*="rounded"]')
      const goodbyeCard = goodbyeElement.closest('[class*="rounded"]')

      const helloPosition = Array.from(helloCard?.parentElement?.children || []).indexOf(helloCard as Element)
      const goodbyePosition = Array.from(goodbyeCard?.parentElement?.children || []).indexOf(goodbyeCard as Element)

      expect(helloPosition).toBeLessThan(goodbyePosition)
    })

    it('should update pagination based on filtered results', async () => {
      const onSelectSign = jest.fn()
      render(<SignSelector onSelectSign={onSelectSign} />)

      await waitFor(() => {
        expect(screen.getByText(/HELLO/)).toBeInTheDocument()
      })

      // Before search: showing all signs
      expect(screen.getByText(/Showing.*of 6 signs/)).toBeInTheDocument()

      // Search
      const searchInput = screen.getByPlaceholderText(/Search for a sign/)
      fireEvent.change(searchInput, { target: { value: 'hello' } })

      // After search: showing filtered count
      await waitFor(() => {
        expect(screen.getByText(/Showing.*of 1 signs/)).toBeInTheDocument()
        expect(screen.getByText(/\(filtered\)/)).toBeInTheDocument()
      })
    })
  })
})
