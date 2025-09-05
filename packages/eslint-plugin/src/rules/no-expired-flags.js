/**
 * Rule: no-expired-flags
 * Boss Rule 8: Design for deletion - Feature flags only for rollout, with expiry ≤14 days
 * 
 * Detects expired feature flags in code:
 * - TODO comments with dates older than 14 days
 * - Feature flags that should have been removed
 * - Kill-switch flags past their expiry
 * - Temporary code paths that became permanent
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'detect expired feature flags and temporary code that should be deleted',
      category: 'Boss Rules',
      recommended: true
    },
    fixable: null,
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          maxDaysOld: {
            type: 'number'
          },
          flagPatterns: {
            type: 'array',
            items: { type: 'string' }
          },
          todoPatterns: {
            type: 'array', 
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const maxDaysOld = options.maxDaysOld || 14;
    const flagPatterns = options.flagPatterns || ['FLAG', 'FEATURE_FLAG', 'KILL_SWITCH', 'TEMP'];
    const todoPatterns = options.todoPatterns || ['TODO', 'FIXME', 'HACK', 'XXX'];

    const sourceCode = context.getSourceCode();

    /**
     * Parse date from common formats in comments
     */
    function parseCommentDate(text) {
      // Simple and reliable date patterns
      const patterns = [
        // ISO: 2024-01-15
        { regex: /(\d{4})-(\d{1,2})-(\d{1,2})/, format: 'iso' },
        // US: 01/15/2024
        { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, format: 'us' },
        // Natural: Jan 15, 2024
        { regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i, format: 'natural' }
      ];

      for (const { regex, format } of patterns) {
        const match = text.match(regex);
        if (match) {
          try {
            if (format === 'iso') {
              // YYYY-MM-DD
              return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
            } else if (format === 'us') {
              // MM/DD/YYYY
              return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
            } else if (format === 'natural') {
              // Month DD, YYYY
              const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              const monthIndex = months.indexOf(match[1].toLowerCase().slice(0, 3));
              if (monthIndex !== -1) {
                return new Date(parseInt(match[3]), monthIndex, parseInt(match[2]));
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
      return null;
    }

    /**
     * Check if a date is older than maxDaysOld
     */
    function isExpired(date) {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return false;
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      return diffDays > maxDaysOld;
    }

    /**
     * Check if comment contains feature flag patterns
     */
    function containsFlagPattern(text) {
      const upperText = text.toUpperCase();
      return flagPatterns.some(pattern => upperText.includes(pattern.toUpperCase()));
    }

    /**
     * Check if comment contains TODO patterns
     */
    function containsTodoPattern(text) {
      const upperText = text.toUpperCase();
      return todoPatterns.some(pattern => upperText.includes(pattern.toUpperCase()));
    }

    /**
     * Extract flag name from comment
     */
    function extractFlagName(text) {
      // Look for common flag patterns
      const flagPatterns = [
        /([A-Z_]+_FLAG)/,
        /FLAG[_\s]*([A-Z_]+)/,
        /(KILL_SWITCH[A-Z_]*)/,
        /([A-Z_]{3,})/  // Any uppercase identifier 3+ chars
      ];

      for (const pattern of flagPatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return 'feature flag';
    }

    /**
     * Format date for display
     */
    function formatDate(date) {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }

    /**
     * Calculate days since date
     */
    function daysSince(date) {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return {
      Program() {
        // Get all comments in the file
        const comments = sourceCode.getAllComments();

        comments.forEach(comment => {
          const text = comment.value.trim();
          const hasFlag = containsFlagPattern(text);
          const hasTodo = containsTodoPattern(text);
          
          // Only check comments that mention flags or todos
          if (!hasFlag && !hasTodo) {
            return;
          }

          const date = parseCommentDate(text);
          if (date && isExpired(date)) {
            const flagName = extractFlagName(text);
            const daysOld = daysSince(date);
            const formattedDate = formatDate(date);
            
            context.report({
              loc: {
                start: { 
                  line: comment.loc.start.line, 
                  column: comment.loc.start.column 
                },
                end: { 
                  line: comment.loc.end.line, 
                  column: comment.loc.end.column 
                }
              },
              message: `Expired ${hasFlag ? 'feature flag' : 'TODO'}: ${flagName} from ${formattedDate} (${daysOld} days old, max: ${maxDaysOld} days). Delete this code.`,
              suggest: [
                {
                  desc: `Remove expired ${hasFlag ? 'feature flag' : 'TODO'} code`,
                  fix(fixer) {
                    // For now, just add a comment indicating it should be removed
                    // ESLint can't safely remove arbitrary code blocks
                    return fixer.insertTextBefore(comment, `/* EXPIRED: Remove this ${hasFlag ? 'flag' : 'TODO'} */ `);
                  }
                }
              ]
            });
          }
        });
      }
    };
  }
};