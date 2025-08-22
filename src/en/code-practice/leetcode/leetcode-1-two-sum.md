---
icon: pen-to-square
date: 2024-01-05
category:
  - Leetcode
tag:
  - Easy
---
# 1. Two Sum


## Code

```java
/**
 * @author ghp
 * @title Two Sum
 */
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // 16 is the recommended initial capacity for HashMap
        Map<Integer, Integer> map = new HashMap<>(16);
        for (int i = 0; i < nums.length; i++) {
            // t is the number we need to find in the hash table
            int t = target - nums[i];
            if (map.containsKey(t)) {
                // Current element at i + previously stored element in Map = target
                return new int[]{map.get(t), i};
            }
            map.put(nums[i], i);
        }
        // According to the problem, there must be a pair of answers, so this line is unreachable
        return new int[0];
    }
}
```

## Solution
First check if the corresponding number exists in the hash table, then insert the current number into the hash table.